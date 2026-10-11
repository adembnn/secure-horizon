// Ecriture / lecture de DEPLOYMENTS_ANCHOR.md (aucune cle ici).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SNOWTRACE } from './eth.mjs';

export const DEPLOY_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'DEPLOYMENTS_ANCHOR.md');
const HEADER = '# Deploiements EvidenceAnchor\n\n| Type | Reseau | Adresse / Racine | Hash de transaction | Lien testnet.snowtrace.io |\n|---|---|---|---|---|\n';

export function recordLine({ type, network = 'Avalanche Fuji C-Chain (43113)', address, txHash, note = '' }) {
  if (!fs.existsSync(DEPLOY_FILE)) fs.writeFileSync(DEPLOY_FILE, HEADER);
  const link = type === 'contrat' ? `${SNOWTRACE}/address/${address}` : `${SNOWTRACE}/tx/${txHash}`;
  fs.appendFileSync(DEPLOY_FILE, `| ${type} | ${network} | ${address}${note ? ' ' + note : ''} | ${txHash} | ${link} |\n`);
}
export function lastContract() {
  if (!fs.existsSync(DEPLOY_FILE)) return null;
  const rows = fs.readFileSync(DEPLOY_FILE, 'utf8').split('\n').filter((l) => l.startsWith('| contrat |'));
  const m = rows.length && rows[rows.length - 1].match(/0x[0-9a-fA-F]{40}/);
  return m ? m[0] : null;
}
