// Écrit STATUS.json : résumé machine-lisible de l'avancement (pour le tableau de bord d'Adem). Aucune donnée sensible.
import fs from "node:fs";
const rd = f => { try { return JSON.parse(fs.readFileSync("data/" + f, "utf8")); } catch { return null; } };
const st = {
  updated_at: new Date().toISOString(), author: "Claude-Titouan",
  banc: {
    legit_ethereum: rd("result_legit_eth.json"), legit_cchain: rd("result_filet_cchain.json"), attaques_ethereum: rd("result_attaques_eth.json"),
    age_contrat: rd("result_age_contrat.json"), nonce_devtest: rd("result_nonce_devtest.json"), attaques_cchain: (() => { try { const a = JSON.parse(fs.readFileSync("data/cchain_attack_logs.json", "utf8")); return { n_tx: a.length }; } catch { return null; } })(),
    indices_spenders: (() => { try { const l = fs.readFileSync("data/indices_spenders.jsonl", "utf8").trim().split("\n").map(x => JSON.parse(x)); return { lignes: l.length, attaque: l.filter(r => r.label === 1).length, legit: l.filter(r => r.label === 0).length }; } catch { return null; } })(),
  },
  notes_jures: { tour1_moyenne: 59.8, tour2_moyenne: 59.3, remarque: "jugements simules, pas des mesures ; plafonnes tant qu aucun test reel n est execute" },
  rapports: fs.readdirSync("..").filter(f => /^[A-R]_/.test(f) || f === "bench" || f === "loop_v3").sort(),
};
fs.writeFileSync("../STATUS.json", JSON.stringify(st, (k, v) => typeof v === "bigint" ? v.toString() : v, 1));
console.log("STATUS.json écrit", st.updated_at);
