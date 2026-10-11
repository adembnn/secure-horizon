// Door "wallet": the person types the operation in the wallet's own Send screen. No page, no extension: Hold up only sees the
// signed raw transaction, when the wallet uses the protective RPC as its network.
const send = (pitch, messageId) => ({ kind: messageId ? 'support_chat' : 'wallet_send', brand: 'Portefeuille Moraine', pitch, buttonLabel: 'Envoyer', ...(messageId ? { messageId } : {}) });

export default [
  { id: 'wallet-send-lookalike', family: 'lookalike', label: 'malveillant', title: 'Envoi vers un sosie de l’adresse d’un contact',
    story: "J'envoie 250 USDC à Paul. J'ai collé son adresse depuis mon historique : même début, même fin.",
    staging: send('Envoyer 250 USDC'), intent: { kind: 'pay_someone', freeText: 'Je paie Paul 250 USDC' },
    recipe: { technique: 'transfer', params: { token: 'dusdc', amount: '250', recipient: 'lookalike_contact' } }, editable: ['amount', 'recipient', 'intentKind', 'pastedMessage'] },
  { id: 'wallet-send-support', family: 'support_scam', label: 'malveillant', title: 'Envoi de presque tout le solde vers une adresse jamais vue, après un message de « support »',
    story: "Le service anti-fraude m'a écrit : je mets mes fonds à l'abri sur le coffre qu'il m'indique.",
    staging: send('Envoyer mes USDC vers le « coffre sécurisé »', 'urgence_bancaire-001'), intent: { kind: 'asked_by_someone', freeText: "Le service anti-fraude m'a dit de mettre mes fonds à l'abri" },
    recipe: { technique: 'transfer', params: { token: 'dusdc', amount: 'most', recipient: 'safe_vault' } }, editable: ['amount', 'recipient', 'intentKind', 'pastedMessage'] },
  { id: 'wallet-send-avax-lookalike', family: 'lookalike', label: 'malveillant', title: 'Envoi d’AVAX vers un sosie de l’adresse d’un contact',
    story: "J'envoie 20 AVAX à Paul, adresse recopiée depuis mes dernières opérations.",
    staging: send('Envoyer 20 AVAX'), intent: { kind: 'pay_someone', freeText: 'Je paie Paul 20 AVAX' },
    recipe: { technique: 'transfer', params: { token: 'avax', amount: '20', recipient: 'lookalike_contact' } }, editable: ['amount', 'recipient', 'intentKind', 'pastedMessage'] },
  { id: 'wallet-send-contact', family: 'transfer', label: 'benin', title: 'Envoi au vrai contact',
    story: "J'envoie 50 USDC à Paul, à l'adresse que j'ai déjà utilisée.",
    staging: send('Envoyer 50 USDC'), intent: { kind: 'pay_someone', freeText: 'Je paie Paul 50 USDC' },
    recipe: { technique: 'transfer', params: { token: 'dusdc', amount: '50', recipient: 'contact' } }, editable: ['amount', 'recipient', 'intentKind', 'pastedMessage'] },
  { id: 'wallet-send-own', family: 'transfer', label: 'benin', title: 'Envoi de presque tout le solde vers son propre second compte',
    story: "Je déplace presque tous mes USDC vers mon second compte.",
    staging: send('Envoyer mes USDC vers mon second compte'), intent: { kind: 'send_to_my_account', freeText: 'Je déplace mes USDC vers mon autre compte' },
    recipe: { technique: 'transfer', params: { token: 'dusdc', amount: 'most', recipient: 'own' } }, editable: ['amount', 'recipient', 'intentKind', 'pastedMessage'] },
  { id: 'wallet-send-new-merchant', family: 'transfer', label: 'benin', title: 'Premier paiement, petit montant, à une adresse nouvelle',
    story: "Je paie 30 USDC à un commerçant pour la première fois.",
    staging: send('Envoyer 30 USDC'), intent: { kind: 'pay_someone', freeText: 'Je paie 30 USDC à un commerçant' },
    recipe: { technique: 'transfer', params: { token: 'dusdc', amount: '30', recipient: 'merchant' } }, editable: ['amount', 'recipient', 'intentKind', 'pastedMessage'] },
].map((s) => ({ door: 'wallet', ...s }));
