/* Hold up Lab : serveur factice. Mêmes formes que l'API réelle (http://127.0.0.1:8800).
   Activé seulement quand /api/health ne répond pas. Rien ici n'est une mesure : tout est écrit à la main
   pour pouvoir développer et relire l'interface sans chaîne. L'interface affiche « Données d'exemple ». */
(function (global) {
  'use strict';

  var VICTIM = '0x7a3F9c21B04e5D8a1f6C2E90aB4733dE8c15E2b9';
  var LOOKALIKE = '0x7a3F1d88Ce0277aF0b3D9a41F6c20e5B4d19E2b9';
  var SPENDER = '0x5E1d00aF3c9B7746d2Ae80c1F9b34D6a07cE4f12';
  var TOKEN = '0x3A8b1f90D2c45E7a6B1d08f9C4e27A5b6D3c1e08';
  var NFT = '0xA71c4E09b2D83f5C6e1B7a904d3F28c5E0b96d11';
  var DELAY = 380;

  function num(x, d) { var n = Number(String(x == null ? '' : x).replace(/\s/g, '').replace(',', '.')); return isFinite(n) && n > 0 ? n : d; }
  function hashOf(s) { var x = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return x >>> 0; }
  function ms(id, level) { return 18 + (hashOf(id + (level || '')) % 70); }
  function fakeHash(seed) { var s = ''; var x = hashOf(seed); while (s.length < 64) { x = Math.imul(x ^ (x >>> 13), 1274126177) >>> 0; s += ('00000000' + x.toString(16)).slice(-8); } return '0x' + s.slice(0, 64); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /* ---------------- catalogue d'exemple ---------------- */
  var SCENARIOS = [
    {
      id: 'ex-site-claim-permit', door: 'site', family: 'permit_claim', label: 'malveillant',
      title: 'Réclamer un airdrop (droit illimité)',
      story: 'Un message promet un airdrop. Le site demande de « vérifier » ton wallet, puis fait signer un droit illimité sur tes USDC.',
      staging: { kind: 'site', brand: 'Glacier Rewards', pitch: 'Ton allocation du programme Glacier est prête. Réclame avant la clôture.', buttonLabel: 'Réclamer mon allocation' },
      intent: { kind: 'connect_or_accept_offer', freeText: '' },
      editable: ['amount', 'intent', 'pastedMessage'], defaults: { amount: '2480', pastedMessage: '' },
      covered: true, nist_csf: ['DE.CM', 'RS.MA'], threat_refs: ['ASI09', 'AML.T0048', 'T1566']
    },
    {
      id: 'ex-wallet-poisoning', door: 'wallet', family: 'address_poisoning', label: 'malveillant',
      title: 'Adresse sosie collée depuis l’historique',
      story: 'Une transaction à 0 USDC a glissé une adresse presque identique dans ton historique. Tu la copies depuis là.',
      staging: { kind: 'wallet_send', brand: 'Cairn Wallet', pitch: 'Envoyer des USDC', buttonLabel: 'Continuer' },
      intent: { kind: 'send_to_my_account', freeText: 'Envoyer vers mon compte habituel' },
      editable: ['amount', 'recipient', 'intent'], defaults: { amount: '500', recipient: LOOKALIKE },
      covered: true, nist_csf: ['DE.AE'], threat_refs: ['T1565', 'D3-IAA']
    },
    {
      id: 'ex-site-mint-all', door: 'site', family: 'nft_approval_all', label: 'malveillant',
      title: 'Mint qui demande tous tes NFT',
      story: 'Un faux mint demande un droit sur toute la collection à la place d’un simple achat.',
      staging: { kind: 'site', brand: 'Aube Genesis', pitch: 'Mint ouvert : 5 000 pièces, 3 402 déjà prises.', buttonLabel: 'Mint maintenant' },
      intent: { kind: 'buy_or_swap', freeText: '' },
      editable: ['intent'], defaults: {},
      covered: true, nist_csf: ['DE.CM'], threat_refs: ['ASI02', 'T1204']
    },
    {
      id: 'ex-wc-swap', door: 'walletconnect', family: 'swap_legit', label: 'benin',
      title: 'Échange normal sur un DEX, depuis le téléphone',
      story: 'Tu échanges 1 000 USDC contre le jeton d’un DEX connu. Le droit donné est limité au montant.',
      staging: { kind: 'site', brand: 'Nordlys Swap', pitch: 'Échange tes jetons au meilleur prix.', buttonLabel: 'Échanger' },
      intent: { kind: 'buy_or_swap', freeText: '' },
      editable: ['amount', 'intent'], defaults: { amount: '1000' },
      covered: true, nist_csf: ['DE.AE'], threat_refs: ['ASI02']
    },
    {
      id: 'ex-exchange-withdraw', door: 'exchange', family: 'withdraw_own', label: 'benin',
      title: 'Retrait vers ton propre wallet',
      story: 'Tu retires 750 USDC depuis ton exchange vers l’adresse de ton wallet, enregistrée depuis des mois.',
      staging: { kind: 'exchange_withdraw', brand: 'Brise Exchange', pitch: 'Retirer des USDC', buttonLabel: 'Confirmer le retrait' },
      intent: { kind: 'send_to_my_account', freeText: '' },
      editable: ['amount'], defaults: { amount: '750', recipient: VICTIM },
      covered: true, nist_csf: ['DE.AE'], threat_refs: ['T1657']
    },
    {
      id: 'ex-wc-support', door: 'walletconnect', family: 'fake_support', label: 'malveillant',
      title: 'Faux support dans une messagerie',
      story: 'Un « agent » te guide pas à pas dans une appli de messagerie et te fait valider une demande WalletConnect.',
      staging: { kind: 'support_chat', brand: 'Brise Exchange', pitch: 'Bonjour, ici le support. Votre compte est gelé.', buttonLabel: 'Valider la vérification', messageText: 'Pour le débloquer, ouvrez WalletConnect et validez la demande que je vous envoie.\nJe reste en ligne avec vous.' },
      intent: { kind: 'asked_by_someone', freeText: '' },
      editable: [], defaults: {},
      covered: false, coverageNote: 'La conversation a lieu dans une messagerie hors du navigateur : l’extension ne la voit pas. Seul le RPC protégé verrait la demande.',
      nist_csf: ['DE.CM'], threat_refs: ['ASI09', 'T1566']
    }
  ];

  var ATTACK_OPTIONS = {
    goals: [
      { id: 'drain_token', label: 'Prendre des jetons (USDC)' },
      { id: 'take_nft', label: 'Prendre des NFT' },
      { id: 'redirect_funds', label: 'Détourner un envoi' }
    ],
    techniques: [
      { id: 'unlimited_approve', goal: 'drain_token', label: 'Droit illimité sur les USDC', note: 'Un approve au montant maximal pour un contrat de ton choix.' },
      { id: 'permit_signature', goal: 'drain_token', label: 'Signature Permit hors chaîne', note: 'La victime signe un message, aucune transaction visible dans son wallet.' },
      { id: 'approve_zero', goal: 'drain_token', label: 'Droit de 0 USDC', note: 'Ne donne rien en réalité. Sert à vérifier qu’une attaque inopérante ne déclenche pas d’alerte inutile.' },
      { id: 'set_approval_all', goal: 'take_nft', label: 'Droit sur toute la collection', note: 'setApprovalForAll pour un opérateur contrôlé par l’attaquant.' },
      { id: 'lookalike_send', goal: 'redirect_funds', label: 'Adresse sosie', note: 'Un envoi vers une adresse qui ressemble à celle que la victime utilise.' }
    ],
    disguises: [
      { id: 'batch', label: 'Caché dans un lot', appliesTo: ['unlimited_approve', 'permit_signature', 'set_approval_all'], note: 'La demande dangereuse est noyée parmi plusieurs opérations banales.' },
      { id: 'fresh_contract', label: 'Contrat tout neuf', appliesTo: ['unlimited_approve', 'permit_signature', 'set_approval_all'], note: 'Le contrat est déployé quelques blocs avant la demande.' },
      { id: 'small_first', label: 'Petit montant d’abord', appliesTo: ['unlimited_approve', 'permit_signature', 'lookalike_send'], note: 'Un premier essai discret avant le gros.' },
      { id: 'poison_history', label: 'Historique empoisonné', appliesTo: ['lookalike_send'], note: 'Une transaction à 0 a placé l’adresse sosie dans l’historique.' }
    ],
    lures: [
      { kind: 'claim', label: 'Page de réclamation', brands: ['Glacier Rewards', 'Nordlys', 'Aube Protocol'], messages: [{ id: 'airdrop', text: 'Ton allocation est prête. Réclame avant la clôture.' }, { id: 'snapshot', text: 'Snapshot terminé : tu es éligible à la saison 2.' }] },
      { kind: 'mint', label: 'Page de mint', brands: ['Aube Genesis', 'Brise Club'], messages: [{ id: 'mint-open', text: 'Mint ouvert : il reste peu de pièces.' }] },
      { kind: 'dex', label: 'Page d’échange', brands: ['Nordlys Swap', 'Cairn Swap'], messages: [{ id: 'best-price', text: 'Échange tes jetons au meilleur prix.' }] },
      { kind: 'message', label: 'Message direct', brands: ['Glacier Rewards', 'Brise Exchange'], messages: [{ id: 'dm-elig', text: 'Ton wallet est éligible. Vérifie avant la clôture.' }, { id: 'dm-refund', text: 'Un remboursement t’attend sur ton compte.' }] },
      { kind: 'support', label: 'Faux support', brands: ['Brise Exchange', 'Cairn Wallet'], messages: [{ id: 'sup-frozen', text: 'Bonjour, ici le support. Votre compte est gelé.' }] },
      { kind: 'wallet_send', label: 'Envoi tapé dans le wallet', brands: ['Cairn Wallet'], messages: [{ id: 'send-hist', text: 'Envoyer des USDC' }] },
      { kind: 'exchange_withdraw', label: 'Retrait depuis un exchange', brands: ['Brise Exchange'], messages: [{ id: 'wd', text: 'Retirer des USDC' }] }
    ],
    doors: [
      { id: 'site', label: 'Site web' }, { id: 'wallet', label: 'Wallet' },
      { id: 'walletconnect', label: 'WalletConnect / mobile' }, { id: 'exchange', label: 'Exchange' }
    ],
    params: {
      amount: { label: 'Montant visé (USDC)', values: ['100', '1000', '2480', 'tout le solde'] },
      spenderKind: { label: 'Qui reçoit le droit', values: [{ value: 'fresh_eoa', label: 'Une adresse neuve' }, { value: 'fresh_contract', label: 'Un contrat neuf' }, { value: 'known_router', label: 'Un routeur connu' }] },
      recipientKind: { label: 'Adresse du destinataire', values: [{ value: 'lookalike', label: 'Sosie de l’adresse habituelle' }, { value: 'fresh', label: 'Adresse sans lien' }] },
      deadline: { label: 'Validité de la signature', values: [{ value: 'short', label: '1 heure' }, { value: 'long', label: '1 an' }] },
      depth: { label: 'Opérations dans le lot', values: ['2', '5', '10'] }
    }
  };

  /* ---------------- vérité terrain ---------------- */
  function drainTruth(amount, seed) {
    return {
      executed: true, reverted: false,
      txs: [{ hash: fakeHash(seed + 'a'), from: VICTIM, to: TOKEN, what: 'approve : droit illimité pour ' + SPENDER.slice(0, 8) + '…' }, { hash: fakeHash(seed + 'b'), from: SPENDER, to: TOKEN, what: 'transferFrom : ' + amount + ' USDC vers l’attaquant' }],
      deltas: [
        { asset: TOKEN, symbol: 'USDC', holder: 'victim', before: String(amount), after: '0', change: String(-amount) },
        { asset: TOKEN, symbol: 'USDC', holder: 'attacker', before: '0', after: String(amount), change: String(amount) }
      ],
      approvals: [{ token: TOKEN, spender: SPENDER, before: '0', after: 'illimité', unlimited: true }],
      control: [], lossUsd: amount
    };
  }
  function nftTruth(seed) {
    return {
      executed: true, reverted: false,
      txs: [{ hash: fakeHash(seed + 'a'), from: VICTIM, to: NFT, what: 'setApprovalForAll : opérateur ' + SPENDER.slice(0, 8) + '…' }, { hash: fakeHash(seed + 'b'), from: SPENDER, to: NFT, what: 'transferFrom : 3 NFT vers l’attaquant' }],
      deltas: [{ asset: NFT, symbol: 'AUBE', holder: 'victim', before: '3', after: '0', change: '-3' }, { asset: NFT, symbol: 'AUBE', holder: 'attacker', before: '0', after: '3', change: '3' }],
      approvals: [{ token: NFT, spender: SPENDER, before: 'aucun', after: 'toute la collection', unlimited: true }],
      control: ['3 NFT Aube Genesis changent de propriétaire : toi, puis l’attaquant.'], lossUsd: 1140
    };
  }
  function sendTruth(amount, seed, toAttacker) {
    return {
      executed: true, reverted: false,
      txs: [{ hash: fakeHash(seed), from: VICTIM, to: toAttacker ? LOOKALIKE : VICTIM, what: 'transfer : ' + amount + ' USDC' }],
      deltas: toAttacker ? [
        { asset: TOKEN, symbol: 'USDC', holder: 'victim', before: '3200', after: String(3200 - amount), change: String(-amount) },
        { asset: TOKEN, symbol: 'USDC', holder: 'attacker', before: '0', after: String(amount), change: String(amount) }
      ] : [{ asset: TOKEN, symbol: 'USDC', holder: 'victim', before: '3200', after: '3200', change: '0' }],
      approvals: [], control: [], lossUsd: toAttacker ? amount : 0
    };
  }
  function emptyTruth() { return { executed: true, reverted: false, txs: [], deltas: [], approvals: [], control: [], lossUsd: 0 }; }

  function verdictOf(kind, id, extra) {
    var base = {
      drain: { level: 'danger', niveau: 'critical', croit: 'Réclamer ton allocation.', reel: 'Ce site pourra dépenser tous tes USDC, sans te redemander.', conseil: 'Annule et ferme la page.', reasons: ['Le droit n’a pas de limite.', 'Le contrat a été créé il y a 3 minutes.'] },
      manip: { level: 'manipulation', niveau: 'critical', croit: 'Réclamer ton allocation.', reel: 'Quelqu’un te dicte quoi signer.', conseil: 'Annule. Parles-en à un proche.', reasons: ['Un vrai support ne te demandera jamais ça.'], quote: 'Pour débloquer votre compte, validez la demande que je vous envoie.' },
      nft: { level: 'danger', niveau: 'critical', croit: 'Acheter une pièce.', reel: 'Ce site pourra prendre tous tes NFT de la collection.', conseil: 'Annule.', reasons: ['Le droit couvre toute la collection.'] },
      addr: { level: 'danger', niveau: 'critical', croit: 'Envoyer vers ton compte habituel.', reel: 'Cette adresse n’est pas celle de ton compte.', conseil: 'Envoie à ton adresse habituelle.', reasons: ['Quelqu’un t’a envoyé 0 USDC depuis cette adresse pour qu’elle apparaisse dans ton historique.'], address_diff: { expected: VICTIM, actual: LOOKALIKE, expectedLabel: 'Adresse que tu utilises d’habitude' } },
      swap: { level: 'attention', niveau: 'warn', croit: 'Échanger 1 000 USDC.', reel: 'Le DEX pourra dépenser jusqu’à 1 000 USDC.', conseil: 'Vérifie le montant, puis continue.', reasons: ['Le droit est limité au montant de l’échange.'] }
    }[kind];
    var v = Object.assign({}, base, extra || {});
    v.ms = ms(id, v.level);
    return v;
  }

  function explain(outcome, ctx) {
    switch (outcome) {
      case 'arrêté': return 'Hold up a affiché « ' + ctx.levelWord + ' » avant la signature. Si la victime signait quand même, elle perdait ' + ctx.loss + '.';
      case 'raté': return 'Hold up n’a rien affiché. La victime aurait signé sans alerte et perdu ' + ctx.loss + '.';
      case 'fausse alerte': return 'Hold up a affiché « ' + ctx.levelWord + ' » alors que l’opération est honnête : rien n’est perdu.';
      case 'laissé passer à raison': return 'Hold up n’a rien affiché et l’opération est honnête : rien n’est perdu.';
      case 'non couvert': return 'Cette porte n’est pas vue par le produit. Sans protection, la victime perdait ' + ctx.loss + '.';
      default: return 'La chaîne de test montre que cette attaque ne produit aucun effet : rien n’est pris, aucun droit n’est donné.';
    }
  }
  function finish(sc, path, verdict, plus, truth) {
    var covered = sc.covered !== false;
    var outcome;
    if (!covered) outcome = 'non couvert';
    else if (sc.label === 'malveillant') {
      var works = truth.lossUsd > 0 || truth.approvals.some(function (a) { return a.unlimited; }) || truth.control.length > 0;
      outcome = !works ? 'attaque inopérante' : verdict ? 'arrêté' : 'raté';
    } else outcome = verdict ? 'fausse alerte' : 'laissé passer à raison';
    if (!covered) { verdict = null; plus = null; path = 'none'; }
    return {
      id: sc.id, door: sc.door, path: path, request: { method: 'eth_sendTransaction', params: [{ from: VICTIM, to: truth.txs[0] ? truth.txs[0].to : TOKEN, data: '0x095ea7b3…' }], note: 'exemple' },
      verdict: verdict, verdictPlus: plus, truth: truth, outcome: outcome,
      explanation: explain(outcome, { levelWord: verdict ? ({ danger: 'Danger', attention: 'Attention', manipulation: 'Manipulation' }[verdict.level] || verdict.level) : '', loss: truth.lossUsd + ' $' })
    };
  }

  function runStatic(sc, params, intent) {
    var p = Object.assign({}, sc.defaults, params || {});
    var id = sc.id;
    var kind = intent && intent.kind;
    if (sc._mock) return runBuilt(sc, p, intent);
    if (id === 'ex-site-claim-permit') {
      var amount = num(p.amount, 2480);
      var v = kind === 'asked_by_someone' || String(p.pastedMessage || '').length > 3 ? verdictOf('manip', id) : verdictOf('drain', id);
      return finish(sc, 'extension', v, null, drainTruth(amount, id));
    }
    if (id === 'ex-wallet-poisoning') {
      var a2 = num(p.amount, 500);
      var rec = String(p.recipient || '').toLowerCase();
      if (rec === VICTIM.toLowerCase()) return finish(sc, 'extension', null, null, sendTruth(a2, id, false));
      return finish(sc, 'extension', verdictOf('addr', id), null, sendTruth(a2, id, true));
    }
    if (id === 'ex-site-mint-all') {
      return finish(sc, 'extension', null, { level: 'danger', addedBy: ['droit sur toute une collection'] }, nftTruth(id));
    }
    if (id === 'ex-wc-swap') {
      var a4 = num(p.amount, 1000);
      var t = emptyTruth();
      t.txs = [{ hash: fakeHash(id), from: VICTIM, to: TOKEN, what: 'approve : ' + a4 + ' USDC pour le routeur' }, { hash: fakeHash(id + 'b'), from: VICTIM, to: TOKEN, what: 'swap : ' + a4 + ' USDC contre NORD' }];
      t.deltas = [{ asset: TOKEN, symbol: 'USDC', holder: 'victim', before: '3200', after: String(3200 - a4), change: String(-a4) }, { asset: NFT, symbol: 'NORD', holder: 'victim', before: '0', after: String(a4 * 0.42), change: String(a4 * 0.42) }];
      t.approvals = [{ token: TOKEN, spender: SPENDER, before: '0', after: String(a4), unlimited: false }];
      return finish(sc, 'extension', verdictOf('swap', id), null, t);
    }
    if (id === 'ex-exchange-withdraw') {
      var a5 = num(p.amount, 750);
      var t5 = sendTruth(a5, id, false);
      t5.deltas = [{ asset: TOKEN, symbol: 'USDC', holder: 'victim', before: '3200', after: String(3200 + a5), change: String(a5) }];
      return finish(sc, 'paste', null, null, t5);
    }
    if (id === 'ex-wc-support') {
      return finish(sc, 'none', null, null, drainTruth(3200, id));
    }
    return finish(sc, 'none', null, null, emptyTruth());
  }

  function runBuilt(sc, p, intent) {
    var m = sc._mock, d = m.disguises || [], amount = num(p.amount, 1000);
    var id = sc.id;
    if (m.technique === 'approve_zero') {
      var t0 = emptyTruth();
      t0.txs = [{ hash: fakeHash(id), from: VICTIM, to: TOKEN, what: 'approve : 0 USDC' }];
      t0.approvals = [{ token: TOKEN, spender: SPENDER, before: '0', after: '0', unlimited: false }];
      return finish(sc, 'extension', null, null, t0);
    }
    if (m.technique === 'set_approval_all') {
      return finish(sc, 'extension', d.indexOf('batch') >= 0 ? null : verdictOf('nft', id), d.indexOf('batch') >= 0 ? { level: 'danger', addedBy: ['droits cachés dans un lot'] } : null, nftTruth(id));
    }
    if (m.technique === 'lookalike_send') {
      return finish(sc, 'extension', verdictOf('addr', id), null, sendTruth(amount, id, true));
    }
    var hidden = d.indexOf('batch') >= 0;
    return finish(sc, 'extension', hidden ? null : verdictOf('drain', id), hidden ? { level: 'danger', addedBy: ['droits cachés dans un lot'] } : null, drainTruth(amount, id));
  }

  /* scénario libre : lecture très sommaire de la requête, pour relire l'interface sans serveur */
  function runCustom(body) {
    var req = body.request || {}, tx = (req.params && req.params[0]) || {}, id = 'libre-' + hashOf(JSON.stringify(req));
    var data = typeof tx === 'object' ? String(tx.data || '') : '';
    var manip = !!(body.pastedMessage && String(body.pastedMessage).length > 3) || (body.intent && body.intent.kind === 'asked_by_someone');
    var sc = { id: id, door: body.door || 'site', label: 'malveillant', covered: true };
    if (req.method === 'eth_signTypedData_v4' || data.indexOf('0x095ea7b3') === 0) {
      var amountHex = data ? data.slice(74) : '';
      var unlimited = req.method === 'eth_signTypedData_v4' || /^f{64}$/i.test(amountHex);
      if (!unlimited) {
        sc.label = 'benin';
        var t = drainTruth(0, id); t.deltas = []; t.lossUsd = 0; t.approvals[0].unlimited = false; t.approvals[0].after = 'montant limité'; t.txs.pop();
        return finish(sc, 'extension', verdictOf('swap', id, { reel: 'Cette adresse pourra dépenser un montant limité de tes jetons.' }), null, t);
      }
      return finish(sc, 'extension', manip ? verdictOf('manip', id) : verdictOf('drain', id), null, drainTruth(2480, id));
    }
    sc.label = 'benin';
    var t2 = sendTruth(100, id, false);
    return finish(sc, 'extension', null, null, t2);
  }

  /* ---------------- construction d'attaque ---------------- */
  var counter = 0;
  function byId(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
  function build(b) {
    var tech = byId(ATTACK_OPTIONS.techniques, b.technique);
    if (!b.goal || !tech) return { message: 'Choisis un objectif et une technique.' };
    if (tech.goal !== b.goal) return { message: 'Cette technique ne sert pas cet objectif.' };
    var bad = (b.disguises || []).filter(function (x) { var dg = byId(ATTACK_OPTIONS.disguises, x); return !dg || dg.appliesTo.indexOf(tech.id) < 0; });
    if (bad.length) return { message: 'Un des déguisements ne s’applique pas à cette technique.' };
    var lure = b.lure || {};
    if (!lure.kind || !lure.brand || !lure.message) return { message: 'Choisis l’appât : type, marque et message.' };
    var door = b.door;
    if (tech.id === 'lookalike_send' && door !== 'wallet' && door !== 'exchange') return { message: 'Un envoi vers une adresse sosie se fait depuis le wallet ou un exchange. Choisis une de ces deux portes.' };
    var L = ATTACK_OPTIONS.lures.filter(function (x) { return x.kind === lure.kind; })[0];
    var msgText = (L && L.messages.filter(function (m) { return m.id === lure.message; })[0] || { text: '' }).text;
    var k = lure.kind;
    var staging = k === 'message' ? { kind: 'message', brand: lure.brand, pitch: msgText, buttonLabel: 'Ouvrir le lien', messageText: msgText }
      : k === 'support' ? { kind: 'support_chat', brand: lure.brand, pitch: msgText, buttonLabel: 'Valider la vérification', messageText: 'Validez la demande que je vous envoie.' }
      : k === 'wallet_send' ? { kind: 'wallet_send', brand: lure.brand, pitch: msgText, buttonLabel: 'Continuer' }
      : k === 'exchange_withdraw' ? { kind: 'exchange_withdraw', brand: lure.brand, pitch: msgText, buttonLabel: 'Confirmer le retrait' }
      : { kind: 'site', brand: lure.brand, pitch: msgText, buttonLabel: k === 'mint' ? 'Mint maintenant' : k === 'dex' ? 'Échanger' : 'Réclamer' };
    counter++;
    var send = tech.id === 'lookalike_send';
    var sc = {
      id: 'atk-ex-' + counter, door: door, family: tech.id, label: 'malveillant',
      title: tech.label + ' : ' + lure.brand, story: 'Attaque montée dans le Lab : ' + tech.label.toLowerCase() + ', appât « ' + lure.brand + ' ».',
      staging: staging, intent: { kind: send ? 'send_to_my_account' : 'connect_or_accept_offer', freeText: '' },
      editable: send ? ['amount', 'recipient', 'intent'] : ['amount', 'intent'],
      defaults: { amount: String(num((b.params || {}).amount, 1000)), recipient: LOOKALIKE },
      covered: !(door === 'walletconnect' && k === 'support'),
      coverageNote: door === 'walletconnect' && k === 'support' ? 'La conversation a lieu hors du navigateur : l’extension ne la voit pas.' : undefined,
      nist_csf: ['DE.CM', 'RS.MA'], threat_refs: ['ASI09', 'T1566'],
      _mock: { goal: b.goal, technique: tech.id, disguises: b.disguises || [] }
    };
    return sc;
  }

  var attackLog = [];
  function seedLog() {
    var a = build({ goal: 'drain_token', technique: 'unlimited_approve', disguises: ['batch'], params: { amount: '2480' }, lure: { kind: 'claim', brand: 'Nordlys', message: 'airdrop' }, door: 'site' });
    var b = build({ goal: 'drain_token', technique: 'approve_zero', disguises: [], params: { amount: '100' }, lure: { kind: 'dex', brand: 'Cairn Swap', message: 'best-price' }, door: 'site' });
    attackLog.push({ id: a.id, author: 'jury (exemple)', savedAt: '2026-10-11T09:10:00Z', scenario: a, lastOutcome: runStatic(a).outcome });
    attackLog.push({ id: b.id, author: 'jury (exemple)', savedAt: '2026-10-11T09:24:00Z', scenario: b, lastOutcome: runStatic(b).outcome });
  }
  seedLog();

  /* ---------------- routeur ---------------- */
  function handle(method, path, body) {
    body = body || {};
    var out;
    if (path === '/api/health') out = { chain: { mode: 'exemple', chainId: 43113, rpcUrl: '—', block: null }, victim: VICTIM, contracts: { token: TOKEN }, product: { detectors: ['droits illimités', 'adresse sosie', 'manipulation'] }, outcomeRule: 'Exemple seulement : arrêté = un niveau Attention ou plus est affiché avant la signature. La règle réelle vient du serveur.' };
    else if (path === '/api/scenarios') out = clone(SCENARIOS);
    else if (path === '/api/custom') out = runCustom(body);
    else if (path === '/api/attack/options') out = clone(ATTACK_OPTIONS);
    else if (path === '/api/attack/build') out = build(body);
    else if (path === '/api/attack/log') out = clone(attackLog);
    else if (path === '/api/attack/save') {
      if (!body.scenario) out = { message: 'Rien à enregistrer.' };
      else { var r = runStatic(body.scenario); attackLog.unshift({ id: body.scenario.id, author: String(body.author || 'anonyme').slice(0, 40), savedAt: new Date().toISOString(), scenario: clone(body.scenario), lastOutcome: r.outcome }); out = { ok: true }; }
    }
    else if (path === '/api/reset') out = { ok: true };
    else if (path === '/api/run') {
      var sc = body.scenario || byId(SCENARIOS, body.id) || SCENARIOS.filter(function (s) { return s.id === body.id; })[0];
      out = sc ? runStatic(sc, body.params, body.intent || sc.intent) : null;
      if (!out) return Promise.reject(Object.assign(new Error('Scénario inconnu : ' + body.id), { status: 404 }));
    }
    else if (path === '/api/run-all') {
      var list = SCENARIOS.filter(function (s) { return (!body.door || s.door === body.door) && (!body.family || s.family === body.family); });
      var results = list.map(function (s) { return runStatic(s, {}, s.intent); });
      var lat = results.map(function (r) { return r.verdict ? r.verdict.ms : null; }).filter(function (x) { return x != null; }).sort(function (a, b) { return a - b; });
      var q = function (f) { return lat.length ? lat[Math.min(lat.length - 1, Math.floor(f * lat.length))] : null; };
      var cnt = function (o) { return results.filter(function (r) { return r.outcome === o; }).length; };
      out = { results: results, summary: { n: results.length, malveillants: list.filter(function (s) { return s.label === 'malveillant'; }).length, benins: list.filter(function (s) { return s.label === 'benin'; }).length, arretes: cnt('arrêté'), rates: cnt('raté'), fausses_alertes: cnt('fausse alerte'), non_couverts: cnt('non couvert'), p50_ms: q(0.5), p95_ms: q(0.95) } };
    }
    else return Promise.reject(Object.assign(new Error('Route inconnue : ' + path), { status: 404 }));
    var copy = clone(out);
    return new Promise(function (res) { setTimeout(function () { res(copy); }, path === '/api/health' ? 0 : DELAY); });
  }

  global.Lab = global.Lab || {};
  global.Lab.mock = { handle: handle };
})(window);
