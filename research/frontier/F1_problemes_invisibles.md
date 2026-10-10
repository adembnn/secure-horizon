# F1 — Les problèmes invisibles (2026-10-10)

> V = vérifié sur page éditeur/primaire · ÀV = secondaire ou vendeur, à vérifier avant le pitch. Beaucoup de chiffres sont de la « télémétrie vendeur » (Push, LayerX, Keepnet) ; le DBIR 2026 reste la meilleure source neutre.

## TL;DR
1. **Fil rouge : presque tout se passe APRÈS l'authentification** (session, jeton, consentement OAuth, règle de messagerie, lien de partage). Les défenseurs surveillent la porte, pas la session.
2. Deux leviers « zéro friction » reviennent partout :
   - **la décroissance silencieuse par non-usage**, avec restauration en un clic ;
   - **la détection de changement de contrôle** (extension, appli OAuth, mainteneur npm, DNS) : la confiance accordée à T0 n'est jamais réévaluée.
3. Meilleurs candidats « ampleur × invisibilité × démo 24 h » : rejeu de session post-MFA, consentements OAuth/SaaS-to-SaaS, partages/guests/oversharing, règles de messagerie malveillantes, secrets hors code, dérive des extensions navigateur.

## Chiffres de contexte
- **DBIR 2026 (Verizon)** : exploitation de vulnérabilités 31 % des accès initiaux, abus d'identifiants 13 % (V) ; **tiers impliqué dans 48 % des violations** (30 % l'an précédent) ; usage régulier d'IA 45 % des employés (15 % un an plus tôt), **67 % via comptes non corporate** ; seules 26 % des KEV critiques corrigées. https://www.verizon.com/about/news/breach-industry-wide-dbir-finds · https://www.esecurityplanet.com/threats/2026-verizon-dbir-the-new-era-of-cyber-threats/
- **M-Trends 2026** (V) : vishing 11 % (2e vecteur initial), phishing e-mail 6 %, **passage de relais à un second groupe en 22 s** en 2025 (plus de 8 h en 2022), détection interne 52 %. https://cloud.google.com/blog/topics/threat-intelligence/m-trends-2026
- **CrowdStrike GTR 2026** (V) : breakout moyen 29 min, **82 % des détections sans malware**.
- Push Security : la moitié des attaques arrive hors e-mail ; ClickFix domine côté navigateur.

## Classement (A = ampleur, I = invisibilité, D = faisabilité démo 24 h ; /5 ; score = A×I×D)
| # | Risque | A | I | D | Score |
|---|---|---|---|---|---|
| 1 | Vol de session / rejeu de jeton après MFA | 5 | 5 | 4 | 100 |
| 2 | Consentements OAuth, phishing d'autorisation, SaaS-to-SaaS | 5 | 4 | 5 | 100 |
| 3 | Liens « anyone », guests périmés, oversharing (Copilot) | 5 | 4 | 4 | 80 |
| 4 | Règles de messagerie / transferts malveillants | 4 | 4 | 5 | 80 |
| 5 | Secrets hors code et clés qui ne meurent pas | 4 | 4 | 5 | 80 |
| 6 | Shadow AI : copier-coller vers comptes perso | 5 | 3 | 5 | 75 |
| 7 | **Extensions navigateur rachetées (dérive de propriété)** | 3 | 5 | 5 | 75 |
| 8 | ClickFix / presse-papiers | 5 | 3 | 4 | 60 |
| 9 | Identités non humaines dormantes | 5 | 4 | 3 | 60 |
| 10 | Ghost logins (mot de passe local sous SSO) | 4 | 5 | 3 | 60 |
| 11 | Persistance dans les configs d'outils dev/IA (vers npm) | 3 | 5 | 4 | 60 |
| 12 | Liens de partage de chats IA indexés | 3 | 4 | 4 | 48 |
| 13 | Sous-domaines orphelins (dangling DNS) | 3 | 4 | 4 | 48 |
| 14 | Helpdesk / reset MFA par vishing | 4 | 3 | 3 | 36 |
| 15 | Invitations calendrier et bots de prise de notes | 3 | 3 | 4 | 36 |
| 16 | Synchronisation navigateur (profil perso) | 3 | 5 | 2 | 30 |
| 17 | QR codes (quishing) | 3 | 2 | 3 | 18 |

## Détail
### 1. Vol de session / rejeu de jeton post-MFA
- Un infostealer ou un proxy AiTM récupère le cookie émis **après** le MFA ; l'attaquant hérite de la session.
- 54 % des victimes de ransomware avaient des identifiants dans des logs d'infostealers (DBIR 2025 via SpyCloud, ÀV) ; 46 % des appareils compromis avec identifiants corporate sont non gérés (Flare, ÀV).
- **Incident Vercel / Context.ai (avril 2026)** : infection Lumma chez Context.ai → jetons OAuth → compte Google Workspace Vercel ; Hudson Rock avait les identifiants plus d'un mois avant. https://thehackernews.com/2026/04/vercel-breach-tied-to-context-ai-hack.html
- Invisible : l'IdP voit une session valide avec MFA satisfait. CAE, token protection et DBSC ne couvrent pas le BYOD ; « impossible travel » est bruyant.
- **Levier** : score passif de continuité de session (empreinte TLS/UA, ASN, rythme) ; MFA silencieuse seulement en cas d'écart.

### 2. Consentements OAuth, phishing d'autorisation, SaaS-to-SaaS
- « Allow All » sur une appli (souvent IA) ou un code d'appareil validé → jetons durables qui **survivent au changement de mot de passe**.
- Organisation moyenne : 16 apps IA, 17 extensions IA, 17 intégrations OAuth IA (Push, V). Kits de phishing par code d'appareil : de 1-2 à plus de 25 en 2026 (V). EvilTokens : 340+ organisations en 5 semaines (V) ; démantèlement par la DCU Microsoft le 22 sept. (ÀV). Salesloft/Drift (août 2025) : 700+ environnements Salesforce (ÀV).
- Invisible : le consentement crée de fait un fournisseur sans revue ; le jeton ne repasse jamais par le MFA.
- **Levier** : scorer chaque consentement au moment du grant (étendue des droits, rareté de l'éditeur dans le tenant, écart avec les pairs) ; quarantaine des seuls cas anormaux ; expiration par non-usage.

### 3. Liens « anyone », guests périmés, oversharing révélé par Copilot
- Des permissions trop larges dorment depuis des années ; **Copilot ou la recherche les rend soudain découvrables**.
- 40 % de 132 DSI ont retardé Copilot d'au moins 3 mois à cause de l'oversharing (Gartner juin 2025, ÀV). Bug Copilot CW1226324 (fév. 2026) : e-mails confidentiels résumés malgré le DLP (ÀV). Microsoft retire le partage par code à usage unique : chaque partage externe crée un guest Entra sans expiration par défaut (ÀV).
- Invisible : personne ne possède le graphe d'accès effectif ; le nettoyage n'a pas de propriétaire.
- **Levier** : lien ou guest inutilisé depuis 90 jours → rétrogradé automatiquement, restauration en un clic.

### 4. Règles de messagerie malveillantes
- Juste après la prise de contrôle, une règle transfère « facture / virement » ou cache les alertes. Elle **survit au changement de mot de passe**.
- ~10 % des comptes compromis en avaient une, parfois créée 5 s après l'accès (Proofpoint Q4 2025, ÀV). BEC : 3,05 Md$ (IC3 2025).
- **Levier** : évaluer la règle dans son contexte (créée peu après une session anormale, mots-clés financiers, destination externe jamais vue).

### 5. Secrets hors code et clés immortelles
- Tokens collés dans Slack, Jira, Confluence, valides des années. GitGuardian 2026 : 28,65 M secrets sur GitHub public, 32,2 % des dépôts internes avec un secret, **64 % des secrets valides en 2022 l'étaient encore en janvier 2026**, 28 % des incidents hors dépôts (ÀV). D'anciennes clés Google publiques gagnent des droits Gemini sans action du propriétaire (ÀV).
- Invisible : détecter n'est pas révoquer ; la rotation casse la prod, donc personne ne l'ose.
- **Levier** : « révocation canari » : remplacer la valeur exposée par un leurre traçable qui alerte à l'usage, pendant la rotation de la vraie clé. (GitGuardian au jury : s'aligner ou éviter le recouvrement.)

### 6. Shadow AI
- DBIR 2026 : 67 % via comptes perso (V). LayerX (vendeur) : 77 % collent des données, 62 % des collages contiennent du PII/PCI. IBM 2025 : ~20 % des violations impliquent du shadow AI, +670 000 $.
- **Levier** : pseudonymisation locale réversible au collage. **Sujet encombré** : ne vaut que si l'angle est neuf.

### 7. Extensions navigateur rachetées (dérive de propriété)
- Un développeur vend une extension saine ; le nouveau propriétaire pousse une mise à jour piégée à tous les utilisateurs, sans alerte.
- « Save Image as Type » (1 M+ utilisateurs) rachetée nov. 2025 → détournement d'affiliation ; QuickLens : transfert le 1er fév. 2026, mise à jour malveillante le 17 fév. (ÀV). https://hackmag.com/news/quicklens-shotbird
- Invisible : aucune alerte au changement de propriétaire tant que les permissions ne changent pas.
- **Levier** : surveillance passive par différence (propriétaire, manifeste, domaines contactés, code entre versions) avec un score « changement de contrôle ». Données publiques suffisantes. **Très bonne originalité.**

### 8. ClickFix / presse-papiers
- Fausse vérification CAPTCHA → commande copiée → collée par la victime dans Win+R. ErrTraffic à 60 % de conversion ; faux téléchargement Claude.ai : 7 100 visites, 29 organisations compromises en 48 h (Push, V).
- **Levier** : corréler « écriture du presse-papiers par une page web » et « exécution collée dans Run/PowerShell ». Attention aux développeurs qui collent légitimement.

### 9. Identités non humaines dormantes
- Ratio machine/humain de 17:1 à 109:1 selon les éditeurs ; 12 % ont un cycle de vie automatisé ; 71 % non tournées dans les délais (ÀV). 80 % des dirigeants croient les comptes dormants suivis, la moitié des praticiens le confirme.
- **Levier** : mise en veille automatique après N jours sans usage, réveil en un clic. Démo plus difficile (cloud réel).

### 10. Ghost logins
- Après activation du SSO, le mot de passe local reste valide, sans MFA, hors radar de l'IdP. 1 connexion sur 4 par mot de passe (Push, ÀV). Cas Snowflake.

### 11. Persistance dans les configs d'outils dev/IA
- Un ver npm vole des secrets puis **s'accroche aux fichiers de configuration des assistants de code** (`~/.claude/…`, `.vscode/tasks.json`) pour persister (CSA). Mini Shai-Hulud mai 2026 : 170+ paquets, 600+ copycats ; vague du 4 août : 400+ (ÀV).
- Invisible : les configs d'assistants de code ne figurent dans aucun inventaire.
- **Levier** : moniteur d'intégrité local des hooks et configs d'outils dev/IA. Proche de la sécurité d'agents (encombré).

### 12-17 (résumé)
- **Liens de partage de chats IA indexés** : ChatGPT été 2025 (4 500 à 70 000 conversations), Grok 370 000+ (ÀV). Levier : surveiller le web public pour des marqueurs propres à l'organisation.
- **Sous-domaines orphelins** : classique, peu original.
- **Reset MFA par vishing** (Scattered Spider) : traiter le ticket de reset comme un événement de risque ; dur à démontrer.
- **Invitations calendrier piégées** pour assistants IA (Gemini, janv. 2026) : proche du pare-feu d'agents.
- **Sync navigateur sur profil perso** : peu de signal défenseur.
- **QR codes** : déjà traités par les passerelles e-mail.

## Synthèse créative : trois idées transversales
1. **Décroissance par non-usage, réversible** : grants OAuth, liens, guests, clés, comptes de service, extensions. Invisible pour l'utilisateur actif (le non-usage prouve qu'il n'en a pas besoin). Respond automatique, réduction continue de la surface. Métriques : surface avant/après, taux de restauration (= faux positifs).
2. **Changement de contrôle sur une confiance accordée** : extension revendue, mainteneur npm compromis, appli OAuth rachetée, DNS orphelin. Même schéma : la confiance de T0 n'est jamais réévaluée. Un détecteur unique de « dérive de contrôle », avec l'IA pour lire les diffs de code et expliquer le risque.
3. **Cohérence de session** : un score continu qui unit jeton, appareil et comportement, sans nouveau prompt, avec réponse graduée.

**Reco de l'agent** : priorité 1 = extensions (7) + OAuth (2) sous le thème « changement de contrôle » (peu encombré, données publiques/synthétiques, récit Vercel/Drift). Priorité 2 = oversharing (3) + identités dormantes (9) sous « décroissance par non-usage ». À éviter : Shadow AI (encombré), invitations calendrier (pare-feu d'agents), secrets si on ne veut pas concurrencer GitGuardian.

## Limites
DBIR 2026 complet non obtenu ; pas de chiffre 2026 fiable sur les liens « anyone » ni sur les comptes d'anciens employés ; plusieurs pages Push en 404.
