# Preuve : remplissage automatique du XLSX officiel AMF DORA (notification initiale)

Statut : EXECUTE pour de vrai (2026-10-10), sortie complete dans `run-proof.log`.

## Approche
1. URL trouvee en lisant la page https://www.amf-france.org/fr/formulaires-et-declarations/dora (lien `href`) :
   `https://www.amf-france.org/sites/institutionnel/files/private/2025-02/dora-incident-reporting-template-v1.2.xlsx`
   (HTTP 200, 131 548 octets, sans compte, sha256 `d465ae15...64b5`). Un second gabarit existe (`dora-significant-cyber-threats-template-v1.2.xlsx`, non utilise).
2. `inspect.mjs` (exceljs) liste feuilles et colonnes. 6 feuilles : Reporting instructions, Type of submission (1.1 en A4),
   Initial notification (1.2 a 1.15 en A..O, 2.1 a 2.10 en Q..Z ; codes en ligne 2, libelles en ligne 3, saisie a partir de la ligne 4),
   Intermediate report (3.1-3.35), Final report (4.1-4.16), List reference (listes des menus deroulants).
3. `incident.synthetic.json` : incident 100 % synthetique (entite, LEI "SNTL0000000000TEST01", contacts en example.invalid).
4. Deux remplisseurs, meme JSON, memes controles (liste autorisee lue dans List reference, LEI = 20 alphanum., e-mail, date ISO `YYYY-MM-DDThh:mm:ssZ`) :
   - `fill.mjs` : exceljs charge / ecrit (ce qui etait demande).
   - `fill-xml.mjs` : patch direct du XML des cellules vides (jszip), pour ne rien perdre.
5. `readback.mjs` relit le fichier produit avec exceljs : compare chaque cellule de chaque feuille au gabarit officiel et releve chaque champ par son code.
6. `fidelity.sh` compte menus deroulants, protections, noms definis dans le gabarit vs sortie.

## Versions
Node v25.6.0 ; exceljs 4.4.0 ; jszip 3.10.2 (dependance d'exceljs) ; Git Bash / Windows 11. Docker non utilise (inutile ici).

## Rejouer
`bash "C:/Users/Adem/AppData/Local/Temp/claude/C--Users-Adem-Secure-Horizon/1802da7a-af03-4cde-bcb5-fe043c52629b/scratchpad/connectors/amf-xlsx/attempt-1/run-proof.sh"`
(telecharge, installe exceljs@4.4.0 dans `work/`, remplit, relit, controle ; code de sortie 0 si tout va bien). Sorties dans `out/`.

## Sortie reelle observee (extraits de run-proof.log)
- Telechargement : `HTTP 200, 131548 bytes`.
- Remplissage : exceljs 26 cellules (+1.1) ; lossless 27 cellules : A4 B4 D4 E4 F4 G4 H4 I4 J4 K4 L4 M4 N4 O4 Q4 R4 S4 T4 U4 U5 V4 V5 W4 X4 Y4 Z4 (+ `Type of submission!A4`).
- Relecture : `cells that differ from the official template: 27` (uniquement les 27 cellules voulues), 27 lignes `OK` (1.1, 1.2 ... 2.10), `READBACK: ALL FIELDS MATCH`, pour les deux fichiers.
  Exemples : `2.2 = 2026-10-10T09:12:45Z`, `2.5 = ["Clients, financial counterparts and transactions affected","Economic impact"]` (multi-selection : une valeur par ligne, U4/U5), `2.6 = ["FR","DE"]`, `1.4 = Crypto-asset service provider`, `2.9 = Yes`.
- Fidelite (gabarit -> exceljs -> lossless) : menus deroulants x14 21 -> **0** -> 21 ; workbookProtection 1 -> **0** -> 1 ; noms definis 9 -> **4** -> 9 ; protections de feuilles 6 -> 6 -> 6.

## Constats utiles pour le produit
- Les menus deroulants du gabarit contiennent des LIBELLES (ex. "Crypto-asset service provider", "Monitoring systems", "Yes"), pas les codes snake_case de List reference. 2.6 = codes ISO pays (liste P). 1.4, 2.5, 2.6 sont multi-selection : une valeur par ligne (4, 5, ...).
- Dates en texte ISO 8601 UTC avec `Z`, validation Excel stricte (formule LEN=20).
- Champ 1.3 scinde en 1.3a (LEI) / 1.3b (EU ID) ; 3.x et 4.x (montants en milliers) non traites ici.
- **exceljs seul degrade le fichier officiel** (perd les 21 menus deroulants, 5 noms definis, la protection du classeur) : utiliser `fill-xml.mjs` pour le fichier a deposer.

## Limites
- Non ouvert dans Excel/LibreOffice (aucun des deux installe) : validite relue seulement via exceljs et inspection du XML. A ouvrir une fois dans Excel avant demo.
- Cellules ecrites en `inlineStr` (Excel les accepte ; il les reconvertit a l'enregistrement) ; l'UI Excel n'a pas ete testee.
- Feuilles protegees par mot de passe (hash SHA-512) : on ecrit dans le XML sans lever la protection ; l'utilisateur verra des cellules deverrouillees seulement la ou le gabarit l'autorise (non verifie visuellement).
- Seules la notification initiale (1.x, 2.x) est couverte ; intermediaire (3.x) et final (4.x) non faits. Aucun depot reel (Sesterce necessite un compte PSCA agree). Donnees synthetiques ; LEI factices (non valides ISO 17442 checksum).
- Aucune chaine, aucune cle, aucun compte externe utilise.
