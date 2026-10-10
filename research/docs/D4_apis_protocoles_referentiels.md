# D4 — API de sécurité, protocoles de paiement par agents, référentiels (lu le 2026-10-10)

**Légende** : [V] = vérifié sur la doc officielle ou par un appel réel ; [I] = incertain.

## API branchables
| API | Endpoint | Clé | Limites | Ce qu'elle ne voit pas |
|---|---|---|---|---|
| **GoPlus** address security [V] | `GET https://api.gopluslabs.io/api/v1/address_security/{addr}?chain_id=43114` | optionnelle | Free ~150 CU/min [I] | Adresse neuve et propre : aucun drapeau. Fuji (43113) n'est pas listé ; interroger en 43114 ou mocker. Attribution « Powered by GoPlus Security » requise |
| **TRM** sanctions [V] | `POST https://api.trmlabs.com/public/v1/sanctions/screening` | optionnelle | 1 req/s, 100/jour sans clé | Sanctions seulement |
| **Chainalysis Oracle** [V] | `0x40C5…C8fb` (mainnet) | — | **déprécié**, absent de Fuji | — |
| **Blockaid** [V] | doc derrière login, accès sur démo | sur demande | — | Réputation et simulation, pas l'origine de l'adresse |
| **Bedrock ApplyGuardrail** | voir D2 | IAM | — | Ne voit ni les tool results ni les arguments d'outils |

Docs :
- GoPlus : https://docs.gopluslabs.io/reference/addresscontractusingget_1.md
- TRM : https://docs.trmlabs.com/api/sanctions/screening/submit-one-or-more-addresses-to-be-screened.md

## VoP (art. 5c du règl. 2024/886) [V]
- **Principe** : le prestataire de paiement vérifie la cohérence entre l'IBAN et le nom avant d'autoriser le virement.
- **Réponses** :
  - `MTCH` (match) ;
  - `CMTC` (close match, avec le nom réel affiché) ;
  - `NMTC` (no match) ;
  - `NOAP` (vérification impossible).
- **Délai** : 3 s maximum, 1 s recommandé.
- **Limites du contrôle** :
  - le payeur peut **passer outre** (5c(5)) ;
  - opt-out possible pour les paiements groupés des entreprises (5c(6)) ;
  - la vérification porte sur un couple IBAN/nom **fourni par la facture piégée**, donc on obtient `MTCH` si le fraudeur a ouvert le compte au bon nom (cas Rimasauskas, Norfund).
- **Sources** :
  - https://eur-lex.europa.eu/eli/reg/2024/886/oj
  - https://www.europeanpaymentscouncil.eu/node/26816

## Protocoles de paiement par agents : aucun ne prouve la provenance du bénéficiaire [V]
| Protocole | Ce qu'il prouve | Ce qu'il ne prouve pas |
|---|---|---|
| **Google AP2 v0.2** (Checkout et Payment Mandates) | Autorisation signée de l'utilisateur ; `allowed_payees` | D'où vient le payee ajouté à la liste |
| **Coinbase x402** | Paiement conforme au payload signé | La légitimité de `payTo`, fixé par le serveur. Le facilitator CDP **ne gère pas Avalanche** ; il faut passer par x402-rs, thirdweb ou PayAI sur Fuji |
| **Visa TAP** | Identité de l'agent (RFC 9421) | Les virements fournisseurs |
| **Mastercard Agent Pay** [I] | Jetons d'agent, « Know Your Agent » | Les IBAN ou adresses arbitraires |
| **Stripe/OpenAI ACP** | Plafond et marchand du jeton délégué | Les bénéficiaires hors des marchands intégrés |

→ **Notre phrase** : « Les protocoles prouvent *qui* autorise et *combien*. Aucun ne prouve *d'où vient* le bénéficiaire. »

## Référentiels (IDs vérifiés)

### OWASP Agentic 2026
- **ASI01** Agent Goal Hijack
- **ASI02** Tool Misuse
- **ASI06** Memory & Context Poisoning
- **ASI07** Insecure Inter-Agent Communication
- **ASI09** Human-Agent Trust Exploitation
- Source : https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/

### MITRE ATLAS (YAML officiel v2026.09)
- **AML.T0051.001** Indirect Prompt Injection
- **AML.T0053** AI Agent Tool Invocation
- **AML.T0048** External Harms (Financial)
- **AML.CS0026** Financial Transaction Hijacking with M365 Copilot
- **AML.M0030** Restrict AI Agent Tool Invocation on Untrusted Data (**notre mitigation exacte**)
- Source : https://github.com/mitre-atlas/atlas-data

### ATT&CK
- **T1566** Phishing
- **T1534** Internal Spearphishing
- **T1657** Financial Theft

### D3FEND
- **D3-IRA** Identifier Reputation Analysis
- **D3-ID** Identifier Analysis
- **D3-AZET** Authorization Event Thresholding
- **D3-CV** Content Validation
- **D3-MAN** Message Authentication
- **D3-MFA** Multi-factor Authentication
- **D3-DO** Decoy Object
- **D3-PS** Process Suspension
- Source : https://d3fend.mitre.org/ontologies/d3fend.csv
