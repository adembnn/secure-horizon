import fs from 'node:fs';
const dev = fs.readFileSync(new URL('../attacks/DEV.jsonl', import.meta.url), 'utf8').trim().split('\n').map(JSON.parse);
const maxlen = Number(process.env.MAXLEN || 2500);
for (const id of process.argv.slice(2)) { const c = dev.find((x) => x.id === id); if (!c) { console.log('?', id); continue; }
  const k = { ...c.context }; delete k.known_protocols; delete k.address_book; delete k.token_registry;
  console.log(id, JSON.stringify({ label: c.label, exp: c.expected_severity, req: c.request, intent: c.intent, ctx: k, reason: c.reason, sig: c.required_signals }).slice(0, maxlen)); console.log(); }
