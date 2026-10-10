import fs from 'node:fs';
const a = JSON.parse(fs.readFileSync('fixtures/approve.json', 'utf8'));
const d1 = structuredClone(a);
d1.spendAmount = '900000000';
d1.outputs = [{ address: '2N1SyntheticDrainAddr0000000000000', value: 900000000 }, a.outputs[1]];
fs.writeFileSync('fixtures/deny-unknown-dest.json', JSON.stringify(d1, null, 2));
const d2 = structuredClone(a);
d2.spendAmount = '5000000'; d2.outputs[0].value = 5000000;
fs.writeFileSync('fixtures/deny-over-cap.json', JSON.stringify(d2, null, 2));
