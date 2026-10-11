// Doors "walletconnect" and "exchange".
// walletconnect: a mobile wallet linked to a site. Transactions are broadcast through the wallet's RPC (seen by the protective RPC);
//                off-chain signatures travel through the WalletConnect relay and are NOT seen: shown as not covered.
// exchange:      a withdrawal from a custodial platform. There is nothing to intercept; the only path is "paste and check"
//                (the address and the message the person pastes before validating on the platform).
const wc = (brand, slug, pitch, buttonLabel) => ({ kind: 'site', brand, origin: `https://${slug}.example`, pitch, buttonLabel, via: 'walletconnect' });
const cex = (pitch, messageId) => ({ kind: 'exchange_withdraw', brand: 'Aiguille Exchange', pitch, buttonLabel: 'Confirmer le retrait', ...(messageId ? { messageId } : {}) });

export default [
  { id: 'wc-approve-unlimited', door: 'walletconnect', family: 'approve', label: 'malveillant', title: 'Autorisation illimitée demandée par un site relié en WalletConnect',
    story: "Sur mon téléphone, le site relié à mon portefeuille me demande de « valider l'accès ».",
    staging: wc('Banquise Finance', 'banquise-finance', 'Épargne Banquise', "Valider l'accès"), intent: { kind: 'connect_or_accept_offer', freeText: "J'active mon compte" },
    recipe: { technique: 'approve', params: { token: 'dusdc', amount: 'max', spender: 'drainer' } }, editable: ['amount', 'spender', 'intentKind', 'pastedMessage'] },
  { id: 'wc-permit-blind-spot', door: 'walletconnect', family: 'permit', label: 'malveillant', title: 'Signature « permit » par WalletConnect : angle mort',
    story: "Sur mon téléphone, le site me demande une signature gratuite pour réclamer un airdrop.",
    staging: { ...wc('Cime Rewards', 'cime-rewards', 'Airdrop Cime : vérification du portefeuille', 'Vérifier et réclamer'), kind: 'message', messageId: 'faux_airdrop-001' },
    intent: { kind: 'connect_or_accept_offer', freeText: 'Je réclame mon airdrop' },
    recipe: { technique: 'permit', params: { token: 'dusdc', amount: 'max', spender: 'drainer', deadline: 'far' } }, editable: ['amount', 'spender', 'deadline', 'intentKind', 'pastedMessage'] },
  { id: 'wc-send-contact', door: 'walletconnect', family: 'transfer', label: 'benin', title: 'Paiement à un contact depuis une application reliée en WalletConnect',
    story: "Depuis l'application de paiement reliée à mon portefeuille, j'envoie 50 USDC à Paul.",
    staging: wc('Névé Pay', 'neve-pay', 'Paiement entre proches', 'Envoyer'), intent: { kind: 'pay_someone', freeText: 'Je paie Paul 50 USDC' },
    recipe: { technique: 'transfer', params: { token: 'dusdc', amount: '50', recipient: 'contact' } }, editable: ['amount', 'recipient', 'intentKind', 'pastedMessage'] },
  { id: 'wc-siwe-blind-spot', door: 'walletconnect', family: 'siwe', label: 'benin', title: 'Connexion par signature en WalletConnect : non vue non plus',
    story: 'Je me connecte à une application depuis mon téléphone.',
    staging: wc('Refuge', 'refuge-app', 'Connexion', 'Se connecter avec mon portefeuille'), intent: { kind: 'connect_or_accept_offer', freeText: 'Je me connecte' },
    recipe: { technique: 'siwe', params: { host: 'refuge-app.example' } }, editable: ['intentKind', 'pastedMessage'] },

  { id: 'exchange-withdraw-platform', door: 'exchange', family: 'exchange', label: 'malveillant', title: 'Retrait vers l’adresse d’une fausse plateforme de placement',
    story: "Mon conseiller m'a donné l'adresse de dépôt de la plateforme. Je retire 2 000 USDC de mon compte d'échange vers cette adresse.",
    staging: cex('Retirer 2 000 USDC vers une adresse externe', 'pig_butchering-001'), intent: { kind: 'asked_by_someone', freeText: "Mon conseiller m'a dit de déposer sur la plateforme" },
    recipe: { technique: 'transfer', params: { token: 'dusdc', amount: '2000', recipient: 'safe_vault' } }, editable: ['amount', 'recipient', 'intentKind', 'pastedMessage'],
    canCheck: ["l'adresse collée (connue, sosie, jamais vue)", 'le message reçu, collé par la personne'], cannotCheck: ['le retrait lui-même : il part de la plateforme', 'le solde et l’historique sur la plateforme'] },
  { id: 'exchange-withdraw-own', door: 'exchange', family: 'exchange', label: 'benin', title: 'Retrait vers son propre portefeuille',
    story: "Je retire 1 000 USDC de mon compte d'échange vers mon portefeuille.",
    staging: cex('Retirer 1 000 USDC vers mon portefeuille'), intent: { kind: 'send_to_my_account', freeText: 'Je rapatrie mes USDC sur mon portefeuille' },
    recipe: { technique: 'transfer', params: { token: 'dusdc', amount: '1000', recipient: 'victim' } }, editable: ['amount', 'recipient', 'intentKind', 'pastedMessage'],
    canCheck: ["l'adresse collée (connue, sosie, jamais vue)", 'le message reçu, collé par la personne'], cannotCheck: ['le retrait lui-même : il part de la plateforme', 'le solde et l’historique sur la plateforme'] },
];
