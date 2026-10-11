// Audit : extrait tous les sélecteurs (0x + 8 hex) cités dans R1..R4, les régénère par keccak256 et signale les erreurs.
// Usage : node src/audit_selectors.mjs  (lecture seule des rapports ; écrit out/selectors_audit.json)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { keccak256, selectorOf } from './keccak.mjs';
import { parseSig, parseParams, canonical } from './abi.mjs';
import { REGISTRY } from './registry.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const R = join(here, '..', '..', '..', 'R_cas_complexes');
const files = ['R1_controle_et_roles.md', 'R2_droits_et_signatures.md', 'R3_execution_indirecte_evasion.md', 'R4_contrepartie_et_tokens.md'];

const byName = new Map();
for (const e of REGISTRY) { if (!byName.has(e.name)) byName.set(e.name, []); byName.get(e.name).push(e); }
// signatures supplémentaires citées sans types, qui ne sont pas dans le registre de décodage
const EXTRA = {
  isValidSignature: ['isValidSignature(bytes32,bytes)'],
  execTransactionFromModule: ['execTransactionFromModule(address,uint256,bytes,uint8)'],
};
for (const [n, sigs] of Object.entries(EXTRA)) for (const s of sigs) { if (!byName.has(n)) byName.set(n, []); byName.get(n).push({ canon: s, selector: selectorOf(s) }); }

const results = [];
for (const f of files) {
  const text = readFileSync(join(R, f), 'utf8');
  const lines = text.split('\n');
  lines.forEach((line, li) => {
    const re = /\b0x([0-9a-fA-F]{8})(?![0-9a-fA-F])/g;
    let m;
    while ((m = re.exec(line))) {
      const cited = '0x' + m[1].toLowerCase();
      const before = line.slice(Math.max(0, m.index - 120), m.index);
      // dernier identifiant candidat avant le sélecteur : nom(types) ou nom nu
      const cands = [...before.matchAll(/([A-Za-z_][A-Za-z0-9_]*)(\(([^()`]*(?:\([^()`]*\)[^()`]*)*)\))?/g)];
      const last = cands[cands.length - 1];
      if (!last) { results.push({ file: f, line: li + 1, cited, status: 'NO_NAME' }); continue; }
      // ne garder que si le nom est suivi d'une parenthèse de types ou d'un nom connu
      let name = last[1], typed = last[2];
      let status, computed, sig;
      if (typed && /^\(\s*(?:[a-z0-9\[\]]+(?:\s*,\s*[a-z0-9\[\]()]+)*)?\s*\)$/i.test(typed) && /^\(\s*(address|bytes|uint|int|bool|string|\))/.test(typed + ')') ) {
        try { const s = parseSig(name + typed); sig = s.canon; computed = s.selector; } catch { /* pas une signature */ }
      }
      if (computed) status = computed === cited ? 'OK' : 'WRONG';
      else {
        const regs = byName.get(name);
        if (regs) {
          const hit = regs.find((e) => e.selector === cited);
          if (hit) { status = 'OK_BY_NAME'; sig = hit.canon; computed = hit.selector; }
          else { status = 'WRONG_BY_NAME'; sig = regs.map((e) => e.canon).join(' | '); computed = regs.map((e) => e.selector).join(' | '); }
        } else status = 'UNRESOLVED';
      }
      if (status === 'UNRESOLVED' || status === 'WRONG_BY_NAME') { // nom adjacent mal apparié (ex. "0x39509351 (increaseAllowance)") : résolution par le sélecteur lui-même
        const bySel = REGISTRY.find((e) => e.selector === cited) || (cited === selectorOf('isValidSignature(bytes32,bytes)') ? { canon: 'isValidSignature(bytes32,bytes)', selector: cited } : null);
        if (bySel) { status = 'OK_BY_SELECTOR'; sig = bySel.canon; computed = bySel.selector; name = bySel.name || 'isValidSignature'; }
      }
      results.push({ file: f, line: li + 1, name, cited, sig, computed, status });
    }
  });
}

// constantes 32 octets citées (slots EIP-1967, rôles)
const slot = (s) => '0x' + (BigInt(keccak256(s)) - 1n).toString(16).padStart(64, '0');
const constants = [
  { what: 'EIP-1967 implementation slot', cited: '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc', computed: slot('eip1967.proxy.implementation') },
  { what: 'EIP-1967 admin slot', cited: '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103', computed: slot('eip1967.proxy.admin') },
  { what: 'EIP-1967 beacon slot', cited: '0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50', computed: slot('eip1967.proxy.beacon') },
  { what: 'isValidSignature magic (ERC-1271)', cited: '0x1626ba7e', computed: selectorOf('isValidSignature(bytes32,bytes)') },
].map((c) => ({ ...c, status: c.cited === c.computed ? 'OK' : 'WRONG' }));

const uniq = new Map();
for (const r of results) { const k = r.cited + '|' + r.status + '|' + (r.name || ''); if (!uniq.has(k)) uniq.set(k, r); }
const summary = { total_mentions: results.length, distinct: uniq.size, by_status: {} };
for (const r of uniq.values()) summary.by_status[r.status] = (summary.by_status[r.status] || 0) + 1;

mkdirSync(join(here, '..', 'out'), { recursive: true });
writeFileSync(join(here, '..', 'out', 'selectors_audit.json'), JSON.stringify({ summary, constants, results: [...uniq.values()] }, null, 1));
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(summary));
  for (const r of uniq.values()) console.log(r.status.padEnd(14), r.file.slice(0, 2), String(r.line).padStart(3), (r.name || '').padEnd(28), r.cited, '->', r.computed ?? '', r.status.startsWith('OK') ? '' : (r.sig || ''));
  for (const c of constants) console.log(c.status, c.what, c.computed);
}
export { results, constants, summary };
