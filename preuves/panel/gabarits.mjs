// Phrases d'utilisateur ordinaires du grand panel, écrites à la main pour cette mission (aucune reprise de la grille existante).
// Aucune phrase d'arnaque, aucune consigne adressée à un modèle : seulement ce qu'une personne écrit pour dire ce qu'elle veut faire.
//
// Jokers : {M} montant + jeton (« 50 USDC »), {D} montant en dollars (« 50 dollars »), {T} jeton dépensé, {T2} jeton reçu,
//          {A} destinataire (adresse collée, ou prénom dans le style « nom »), {P} protocole ou adresse à qui le droit est donné.
// Le séparateur '|' coupe chaque liste en deux : les gabarits placés APRÈS ne servent qu'à la moitié contrôle (formulations jamais
// vues par la moitié réglage).
// Un gabarit peut être un objet { t, vague: true } : la phrase ne dit alors rien de vérifiable (« on m'a dit de valider »).

export const TPL = {
  swap: {
    precis: {
      fr: ['Je veux échanger {M} contre du {T2}', 'Échanger {M} contre {T2}', 'Je souhaite convertir {M} en {T2}', 'Swap de {M} vers {T2}', 'Vendre {M} pour obtenir du {T2}', 'J\'échange {M} contre des {T2}', '|', 'Je voudrais troquer {M} contre du {T2}', 'Passer {M} en {T2}'],
      en: ['I want to swap {M} for {T2}', 'Swap {M} to {T2}', 'Trade {M} for {T2}', 'I\'d like to exchange {M} for {T2}', 'Convert {M} into {T2}', 'Selling {M} for {T2}', '|', 'Change {M} to {T2} please', 'I am turning {M} into {T2}'],
    },
    familier: {
      fr: ['je swap {M} en {T2}', 'jveux changer {M} en {T2} stp', 'allez on échange {M} contre du {T2}', 'je convertis {M} en {T2} vite fait', 'échange {M} pour du {T2}', '|', 'je bascule {M} sur du {T2}', 'hop {M} en {T2}'],
      en: ['swap {M} to {T2} pls', 'gonna trade {M} for {T2}', 'just swapping {M} into {T2}', '|', 'gonna flip {M} into {T2}', 'quick swap {M} for {T2}'],
    },
    fautes: {
      fr: ['Je veux echanger {M} contre du {T2}', 'Je veu échangé {M} contre du {T2}', 'echangé {M} conte {T2}', 'Je souhaite convertire {M} en {T2}', 'je veux échnager {M} contre {T2}', 'swaper {M} en {T2}', '|', 'j\'aimerai echangé {M} pour du {T2}', 'échanjer {M} contre {T2}'],
    },
    sans_montant: {
      fr: ['Je veux échanger mes {T} contre du {T2}', 'Échanger des {T} contre {T2}', 'convertir mes {T} en {T2}', 'je veux swap mes {T}', '|', 'troquer mes {T} contre du {T2}'],
      en: ['Swap my {T} for {T2}', 'I want to trade some {T} for {T2}', 'Convert my {T} to {T2}', '|', 'Sell my {T} for {T2}'],
    },
    dollars: {
      fr: ['Je veux échanger {D} contre du {T2}', 'Acheter pour {D} de {T2}', 'mettre {D} dans du {T2}', '|', 'convertir {D} en {T2}'],
      en: ['Swap {D} for {T2}', 'Buy {D} worth of {T2}', 'I want to put {D} into {T2}', '|', 'I want {D} of {T2}'],
    },
    dictee: {
      fr: ['On m\'a dit d\'échanger {M} contre du {T2}', 'Le support m\'a demandé de convertir {M} en {T2}', 'Mon conseiller m\'a dit de swapper {M} en {T2}', 'un ami m\'a conseillé d\'échanger {M} contre {T2}', '|', 'Quelqu\'un au téléphone m\'a demandé d\'échanger {M} en {T2}'],
      en: ['My advisor told me to swap {M} for {T2}', 'Support asked me to convert {M} to {T2}', 'I was told to swap {M} into {T2}', '|', 'A friend told me to trade {M} for {T2}'],
    },
  },
  grant: {
    precis: {
      fr: ['Autoriser {P} à utiliser {M}', 'Je veux autoriser {P} à dépenser {M}', 'Donner à {P} le droit d\'utiliser {M}', 'J\'approuve {M} pour {P}', 'Approuver {M} sur {P}', 'Je donne l\'autorisation à {P} pour {M}', '|', 'Permettre à {P} de prendre {M}', 'Accorder à {P} un accès à {M}'],
      en: ['Approve {M} for {P}', 'Allow {P} to spend {M}', 'I want to give {P} permission to use {M}', 'Grant {P} an allowance of {M}', 'Give {P} access to {M}', '|', 'Let {P} use {M}', 'Authorize {P} to move {M}'],
    },
    familier: {
      fr: ['j\'autorise {P} pour {M}', 'ok pour que {P} utilise {M}', 'je valide l\'approve de {M} pour {P}', 'je laisse {P} utiliser {M}', '|', 'feu vert à {P} pour {M}', 'j\'ouvre {M} à {P}'],
      en: ['approve {M} on {P} pls', 'ok letting {P} spend {M}', '|', 'fine, {P} can use {M}'],
    },
    fautes: {
      fr: ['Autorisé {P} a utiliser {M}', 'Je veux autorisé {P} à dépensé {M}', 'aprouver {M} pour {P}', 'Doner à {P} le droit d\'utilisé {M}', 'j\'autorize {P} pour {M}', '|', 'Permetre à {P} de prendre {M}', 'j\'aprouve {M} sur {P}'],
    },
    sans_montant: {
      fr: ['Autoriser {P} à utiliser mes {T}', 'Je veux approuver mes {T} sur {P}', 'Donner à {P} le droit d\'utiliser mes {T}', '|', 'Donner accès à mes {T} à {P}'],
      en: ['Approve my {T} for {P}', 'Allow {P} to spend my {T}', '|', 'Let {P} use my {T}'],
    },
    dollars: {
      fr: ['Autoriser {P} à utiliser {D}', 'J\'approuve {D} pour {P}', '|', 'Donner à {P} le droit de dépenser {D}'],
      en: ['Approve {D} for {P}', 'Allow {P} to spend {D}', '|', 'Let {P} use {D}'],
    },
    dictee: {
      fr: ['On m\'a dit d\'autoriser {P} à utiliser {M}', 'Le support m\'a demandé d\'approuver {M} pour {P}', 'Un conseiller m\'a dit de donner à {P} le droit d\'utiliser {M}', '|', 'Mon conseiller m\'a dit d\'approuver {M} sur {P}'],
      en: ['I was told to approve {M} for {P}', 'Support asked me to allow {P} to spend {M}', '|', 'Someone told me to allow {P} to spend {M}'],
    },
    illimite: {
      fr: ['Autoriser {P} à utiliser tous mes {T}, sans limite', 'Je donne à {P} un accès illimité à mes {T}', 'J\'approuve un montant illimité de {T} pour {P}', '|', 'Donner à {P} le droit d\'utiliser tous mes {T} sans plafond'],
      en: ['Approve unlimited {T} for {P}', 'Give {P} unlimited access to my {T}', '|', 'Allow {P} to spend all my {T}, no limit'],
    },
  },
  pay: {
    precis: {
      fr: ['Envoyer {M} à {A}', 'Je veux payer {M} à {A}', 'Transférer {M} vers {A}', 'Je verse {M} à l\'adresse {A}', 'Virement de {M} à {A}', 'Je rembourse {M} à {A}', 'Envoyer {M} vers mon Ledger {A}', '|', 'Régler {M} à {A}', 'Faire parvenir {M} à {A}', 'Mettre {M} à l\'abri sur mon autre portefeuille {A}'],
      en: ['Send {M} to {A}', 'Pay {M} to {A}', 'Transfer {M} to {A}', 'I want to send {M} to {A}', 'Sending {M} to {A} for rent', 'Move {M} to my own wallet {A}', '|', 'Wire {M} to {A}', 'Pay back {M} to {A}', 'Send {M} to my cold wallet {A}'],
    },
    familier: {
      fr: ['j\'envoie {M} à {A}', 'je file {M} à {A}', 'jbalance {M} à {A}', 'je paye {M} à {A} pour le resto', '|', 'je passe {M} à {A}', 'un petit virement de {M} pour {A}'],
      en: ['sending {M} to {A} real quick', 'gotta pay {M} to {A}', '|', 'shooting {M} over to {A}'],
    },
    fautes: {
      fr: ['Envoyé {M} à {A}', 'Je veux payé {M} a {A}', 'transferer {M} ver {A}', 'j\'envoi {M} à {A}', 'Envoyez {M} a {A}', '|', 'je rembource {M} a {A}', 'viremen de {M} à {A}'],
    },
    sans_montant: {
      fr: ['Envoyer des {T} à {A}', 'Je veux payer {A} en {T}', 'Transférer mes {T} à {A}', '|', 'Faire un envoi de {T} à {A}'],
      en: ['Send some {T} to {A}', 'Pay {A} in {T}', '|', 'Move my {T} to {A}'],
    },
    dollars: {
      fr: ['Envoyer {D} à {A}', 'Payer {D} à {A}', '|', 'Je dois {D} à {A}, je paie'],
      en: ['Send {D} to {A}', 'Pay {D} to {A}', '|', 'I owe {D} to {A}, paying now'],
    },
    dictee: {
      fr: ['On m\'a dit d\'envoyer {M} à {A}', 'Le support m\'a demandé de transférer {M} vers {A}', 'Mon conseiller m\'a dit de verser {M} à {A}', '|', 'Le conseiller au téléphone m\'a dit de verser {M} à {A}'],
      en: ['My advisor told me to send {M} to {A}', 'I was asked to pay {M} to {A}', '|', 'Someone asked me to transfer {M} to {A}'],
    },
  },
  deposit: {
    precis: {
      fr: ['Déposer {M} sur {P}', 'Je veux prêter {M} sur {P}', 'Je mets {M} en dépôt sur {P}', '|', 'Placer {M} sur {P}'],
      en: ['Deposit {M} into {P}', 'Supply {M} to {P}', 'I want to lend {M} on {P}', '|', 'Put {M} to work on {P}'],
    },
    familier: {
      fr: ['je mets {M} sur {P}', 'je dépose {M} sur {P} pour les intérêts', '|', 'je case {M} sur {P}'],
      en: ['parking {M} on {P}', '|', 'dropping {M} into {P}'],
    },
    fautes: {
      fr: ['Deposer {M} sur {P}', 'Je veux prété {M} sur {P}', '|', 'déposé {M} sure {P}'],
    },
    sans_montant: {
      fr: ['Déposer mes {T} sur {P}', '|', 'Placer mes {T} sur {P}'],
      en: ['Deposit my {T} into {P}', '|', 'Supply my {T} to {P}'],
    },
    dollars: {
      fr: ['Déposer {D} sur {P}', '|', 'Placer {D} sur {P}'],
      en: ['Deposit {D} into {P}', '|', 'Supply {D} to {P}'],
    },
    dictee: {
      fr: ['On m\'a dit de déposer {M} sur {P}', '|', 'Mon conseiller m\'a dit de placer {M} sur {P}'],
      en: ['I was told to deposit {M} into {P}', '|', 'An advisor told me to supply {M} to {P}'],
    },
  },
  // La personne ne s'attend ni à dépenser ni à donner un droit : se connecter, récupérer, regarder.
  rien: {
    precis: {
      fr: ['Me connecter', 'Je veux juste me connecter au site', 'Connexion à mon compte', 'Connecter mon portefeuille', 'Récupérer mon airdrop', 'Je veux réclamer mes récompenses', 'Recevoir mes jetons gratuits', 'Récupérer mon remboursement', 'Voir mon solde', 'Consulter mes NFT', '|', 'M\'identifier sur le site', 'Toucher mes récompenses', 'Afficher mon portefeuille'],
      en: ['Sign in', 'Log in to the site', 'Connect my wallet', 'Claim my airdrop', 'Claim my rewards', 'Get my refund', 'Check my balance', 'Just looking at my portfolio', '|', 'Just logging in', 'Get my free tokens', 'View my rewards'],
    },
    familier: {
      fr: ['je me connecte', 'juste me loguer', 'je récupère mes gains', 'je prends mon airdrop', 'je regarde juste mon compte', '|', 'je chope mes récompenses', 'je me log vite fait'],
      en: ['just signing in', 'grabbing my airdrop', '|', 'gonna claim my stuff'],
    },
    fautes: {
      fr: ['me conecter', 'je veux me connécté', 'conexion au site', 'recuperer mon airdrop', 'réclamé mes recompenses', 'recupéré mon rembourssement', '|', 'me connecté au site', 'recupérer mes jeton gratuit'],
    },
    dictee: {
      fr: ['On m\'a dit de me connecter pour vérifier mon compte', 'Le support m\'a demandé de signer pour récupérer mon remboursement', { t: 'On m\'a dit de valider', vague: true }, { t: 'Le support m\'a dit de confirmer', vague: true }, '|', 'On m\'a demandé de me connecter pour débloquer mon compte', { t: 'On m\'a dit d\'accepter', vague: true }],
      en: ['Support told me to sign in to get my refund', 'I was told to connect my wallet to verify my account', { t: 'I was told to confirm', vague: true }, '|', 'They told me to log in to receive my refund', { t: 'Someone told me to approve it', vague: true }],
    },
  },
  // Phrase qui ne dit rien de vérifiable, quel que soit l'acte voulu.
  vague: {
    fr: ['ok', 'valider', 'continuer', 'faire la transaction', 'confirmer', 'je sais pas', 'oui', 'une opération', 'signer', 'faire un truc sur le site', '|', 'c\'est bon', 'suivant', 'ce qu\'il faut'],
    en: ['confirm', 'do the thing', 'go', 'proceed', 'yes', 'a transaction', 'sign it', '|', 'let\'s go', 'whatever it takes', 'next'],
  },
};

export const PRENOMS = ['Paul', 'Léa', 'ma sœur', 'mon propriétaire', 'Karim', 'Maman', 'Julie', 'mon frère', 'Thomas', 'mon coloc'];
export const NAMES_EN = ['Paul', 'my sister', 'my landlord', 'Mum', 'Julie', 'my brother', 'Tom', 'my roommate'];

// Montants écrits en toutes lettres (seulement ceux-ci sont utilisés dans le style « lettres »).
export const LETTRES = {
  fr: { '1': 'un', '2': 'deux', '3': 'trois', '5': 'cinq', '12': 'douze', '20': 'vingt', '25': 'vingt-cinq', '40': 'quarante', '50': 'cinquante', '75': 'soixante-quinze', '100': 'cent', '150': 'cent cinquante', '200': 'deux cents', '250': 'deux cent cinquante', '300': 'trois cents', '500': 'cinq cents', '1000': 'mille' },
  en: { '1': 'one', '2': 'two', '3': 'three', '5': 'five', '12': 'twelve', '20': 'twenty', '25': 'twenty-five', '40': 'forty', '50': 'fifty', '75': 'seventy-five', '100': 'one hundred', '150': 'one hundred fifty', '200': 'two hundred', '250': 'two hundred fifty', '300': 'three hundred', '500': 'five hundred', '1000': 'one thousand' },
};
