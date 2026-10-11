/* Hold up - hold state machine. Pure module: no chrome.*, no timer, no DOM.
 * The caller injects a storage (chrome.storage.session shape), a clock and an alarm scheduler.
 * Every pending request lives in the storage, deadlines are absolute timestamps, so the hold survives a service worker restart.
 * Rules (fail closed):
 *   - "allow" exists only as a stored human decision taken after the friction was satisfied; anything else is a refusal ;
 *   - cancel is accepted at any time, never delayed, and wins over an allow that the page has not consumed yet ;
 *   - one decision per screen (seq) : a stale or repeated decision is ignored. */
export const KEY = 'hu:req:';
export const LIMITS = {
  minShowMs: 600,            // a click or a key already on its way when the screen appears is not a consent
  expireAfterMs: 30 * 60000, // an undecided request is refused this long after its friction deadline
  orphanMs: 180000,          // the page stopped asking for its answer (closed, navigated) : refused
  seenEveryMs: 5000,         // how often a poll refreshes lastSeen in the storage
  keepDecidedMs: 120000,     // a decided record nobody acknowledged is dropped after this
  maxPerTab: 3
};
const RID = /^[A-Za-z0-9-]{8,64}$/;
export const validRid = (rid) => typeof rid === 'string' && RID.test(rid);
const clamp = (x, lo, hi, dflt) => { const n = Number(x); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n))) : dflt; };

// Friction per level. The durations come from the settings (demo values allowed) but the mechanism is the same and has a floor.
export function frictionFor(level, cfg = {}) {
  if (level === 'manipulation') return { phrase: false, waitMs: clamp(cfg.manipulationHoldMs, 30000, 3600000, 600000) };
  // "unknown" gets the Danger friction : otherwise a request made unreadable on purpose would skip both the red screen and the delay.
  if (level === 'danger' || level === 'unknown') return { phrase: true, waitMs: clamp(cfg.dangerWaitMs, 5000, 600000, 30000) };
  return { phrase: false, waitMs: 0 }; // attention : read and continue
}

// Puts a record on its verdict screen : the deadline starts now, as an absolute timestamp.
// `verdict.relief` (set by the gatekeeper only, never taken from the engine) : the one gap whose correction is already done or
// offered (a spending right wider than the written amount, in a transaction) has no waiting time. Never on Manipulation.
export function enterVerdict(rec, verdict, cfg, now) {
  const f = verdict.relief === true && verdict.level !== 'manipulation' ? { phrase: false, waitMs: 0 } : frictionFor(verdict.level, cfg);
  rec.stage = 'verdict';
  rec.verdict = verdict;
  rec.level = verdict.level;
  rec.shownAt = now;
  rec.friction = { phrase: f.phrase, phraseDone: false, waitMs: f.waitMs, deadline: now + f.waitMs };
  rec.expireAt = rec.friction.deadline + LIMITS.expireAfterMs;
  return rec;
}

export class HoldStore {
  // storage : { get(key|null) -> object, set(object), remove(key) } ; alarms (optional) : { create(name, whenMs), clear(name) }
  constructor({ storage, now = () => Date.now(), alarms = null, allowAuto = false } = {}) {
    this.storage = storage; this.now = now; this.alarms = alarms; this.allowAuto = allowAuto;
    this.chain = Promise.resolve();
  }
  // Serialises read-modify-write sequences inside one worker life (the storage is the only state shared across lives).
  lock(fn) { const p = this.chain.then(fn, fn); this.chain = p.catch(() => {}); return p; }
  async read(rid) { if (!validRid(rid)) return null; const k = KEY + rid; const r = (await this.storage.get(k))[k]; return r && r.rid === rid ? r : null; }
  async write(rec) { await this.storage.set({ [KEY + rec.rid]: rec }); return rec; }
  async all() { const o = await this.storage.get(null); return Object.keys(o || {}).filter((k) => k.startsWith(KEY)).map((k) => o[k]).filter((r) => r && r.rid); }
  get(rid) { return this.lock(() => this.read(rid)); }
  alarm(rec) {
    if (!this.alarms) return;
    try {
      this.alarms.create('hu:exp:' + rec.rid, rec.expireAt);
      if (rec.stage === 'verdict' && rec.friction && rec.friction.waitMs > 0) this.alarms.create('hu:hold:' + rec.rid, rec.friction.deadline);
    } catch (_) {}
  }
  unalarm(rid) { if (!this.alarms) return; try { this.alarms.clear('hu:exp:' + rid); this.alarms.clear('hu:hold:' + rid); } catch (_) {} }

  // Creates the pending record. `init` carries the first screen (stage and its data). Idempotent on rid.
  open({ rid, tabId, frameId, origin, site, method, init }) {
    return this.lock(async () => {
      if (!validRid(rid) || tabId == null) return { error: 'invalide' };
      const old = await this.read(rid);
      if (old) return old.tabId === tabId && old.frameId === frameId ? { rec: old, existed: true } : { error: 'invalide' };
      const pending = (await this.all()).filter((r) => r.tabId === tabId && r.status === 'pending');
      if (pending.length >= LIMITS.maxPerTab) return { error: 'trop-de-demandes' };
      const now = this.now();
      const rec = Object.assign({ rid, tabId, frameId, origin, site, method, createdAt: now, lastSeen: now, seq: 1, status: 'pending', outcome: null,
        decidedBy: null, decidedAt: null, human: null, ui: null, windowId: null, stage: 'intent', expireAt: now + LIMITS.expireAfterMs }, init || {});
      rec.status = 'pending'; rec.outcome = null; rec.human = null; // never from the caller
      await this.write(rec); this.alarm(rec);
      return { rec };
    });
  }

  // Non-decision transition (intent answered, question answered, verdict recomputed, window attached).
  // `seq` null = bookkeeping that keeps the same screen. The mutation can never decide the request.
  advance(rid, seq, mutate) {
    return this.lock(async () => {
      const rec = await this.read(rid);
      if (!rec || rec.status !== 'pending') return { status: 'ignored' };
      if (seq != null && seq !== rec.seq) return { status: 'ignored' };
      mutate(rec, this.now());
      rec.status = 'pending'; rec.outcome = null; rec.human = null; rec.decidedBy = null; rec.decidedAt = null;
      if (seq != null) rec.seq++;
      await this.write(rec); this.alarm(rec);
      return { status: 'next', rec };
    });
  }

  // A decision coming from a screen. by : 'human' (a real gesture in the Hold up window or overlay).
  // -> { status: 'allow' | 'deny' | 'again' | 'ignored', rec, leftMs?, why? }
  submit(rid, { seq, decision, phraseOk = false, by = 'human', meta = null } = {}) {
    return this.lock(async () => {
      const rec = await this.read(rid);
      const now = this.now();
      if (!rec) return { status: 'ignored', why: 'inconnue' };
      if (decision === 'cancel') {
        // Cancel always wins : any stage, any time, and over an allow that the page has not consumed yet.
        if (rec.status === 'decided' && rec.outcome === 'deny') return { status: 'ignored', rec };
        Object.assign(rec, { status: 'decided', outcome: 'deny', decidedBy: by, decidedAt: now, human: null, meta });
        await this.write(rec); this.unalarm(rid);
        return { status: 'deny', rec };
      }
      if (decision !== 'continue') return { status: 'ignored', rec };
      if (rec.status !== 'pending') return { status: 'ignored', rec };            // double decision
      if (seq !== rec.seq || rec.stage !== 'verdict' || !rec.friction) return { status: 'ignored', rec }; // stale screen
      if (by !== 'human' && !(this.allowAuto && by === 'auto-test')) return { status: 'ignored', rec };
      if (now - rec.shownAt < LIMITS.minShowMs) return { status: 'again', rec, why: 'trop-tot', leftMs: Math.max(0, rec.friction.deadline - now) };
      const f = rec.friction;
      if (f.phrase && !f.phraseDone) {
        if (!phraseOk) return { status: 'again', rec, why: 'phrase', leftMs: Math.max(0, f.deadline - now) };
        f.phraseDone = true;
      }
      if (now < f.deadline) { rec.seq++; await this.write(rec); return { status: 'again', rec, why: 'attente', leftMs: f.deadline - now }; }
      Object.assign(rec, { status: 'decided', outcome: 'allow', decidedBy: by, decidedAt: now, human: { at: now, seq: rec.seq }, meta });
      await this.write(rec); this.unalarm(rid);
      return { status: 'allow', rec };
    });
  }

  // Refusal decided by the system (window closed, tab closed, expired, page gone). Never an allow.
  cancel(rid, by) { return this.submit(rid, { decision: 'cancel', by }); }

  // The page side asks for its answer by request id ; the worker answers from the storage only.
  poll(rid, { tabId, frameId } = {}) {
    return this.lock(async () => {
      const rec = await this.read(rid);
      if (!rec || rec.tabId !== tabId || rec.frameId !== frameId) return { state: 'unknown' };
      const now = this.now();
      if (rec.status === 'pending') {
        if (now >= rec.expireAt) {
          Object.assign(rec, { status: 'decided', outcome: 'deny', decidedBy: 'expired', decidedAt: now, human: null });
          await this.write(rec); this.unalarm(rid);
          return { state: 'deny', rec };
        }
        if (now - rec.lastSeen >= LIMITS.seenEveryMs) { rec.lastSeen = now; await this.write(rec); }
        return { state: 'pending', rec };
      }
      // No allow without a recorded human decision, whatever else the record says.
      const human = rec.outcome === 'allow' && rec.human && typeof rec.human.at === 'number' && (rec.decidedBy === 'human' || (this.allowAuto && rec.decidedBy === 'auto-test'));
      return { state: human ? 'allow' : 'deny', rec };
    });
  }

  // The page consumed its answer : the record is gone, the id can never be replayed.
  ack(rid, { tabId, frameId } = {}) {
    return this.lock(async () => {
      const rec = await this.read(rid);
      if (!rec || rec.tabId !== tabId || rec.frameId !== frameId || rec.status !== 'decided') return false;
      await this.storage.remove(KEY + rid); this.unalarm(rid);
      return true;
    });
  }

  // Housekeeping, run on alarms and at worker start. Returns the records it just refused (the caller closes their window).
  sweep() {
    return this.lock(async () => {
      const now = this.now(); const closed = [];
      for (const rec of await this.all()) {
        if (rec.status === 'pending') {
          const why = now >= rec.expireAt ? 'expired' : now - rec.lastSeen >= LIMITS.orphanMs ? 'orphan' : null;
          if (!why) continue;
          Object.assign(rec, { status: 'decided', outcome: 'deny', decidedBy: why, decidedAt: now, human: null });
          await this.write(rec); this.unalarm(rec.rid); closed.push(rec);
        } else if (now - (rec.decidedAt || 0) >= LIMITS.keepDecidedMs) { await this.storage.remove(KEY + rec.rid); this.unalarm(rec.rid); }
      }
      return closed;
    });
  }
}
