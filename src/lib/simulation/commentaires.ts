/**
 * Habillage textuel des matchs : ce que le moteur produit en langage humain.
 * Chaque discipline a son vocabulaire ; une entrée générique sert de filet
 * pour tout sport ajouté plus tard depuis l'administration.
 */

export type ReglagesSport = {
  /** Durée affichée du match, dans l'unité de la discipline. */
  duree: number
  /** Met en forme la progression : 34' , manche 3, 60 m… */
  libelleTemps: (valeur: number) => string
  /** Comment on nomme un point marqué. */
  nomPoint: string
  point: string[]
  occasion: string[]
  fait: string[]
}

const GENERIQUE: ReglagesSport = {
  duree: 100,
  libelleTemps: (v) => `${v} %`,
  nomPoint: 'point',
  point: [
    '{joueur} conclut et marque le point.',
    '{joueur} prend le dessus : point pour son camp.',
    'Action décisive de {joueur}, qui ajoute un point.',
  ],
  occasion: [
    '{joueur} tente sa chance, sans succès.',
    'Belle intention de {joueur}, mais rien au bout.',
    'Échange serré, personne ne marque.',
  ],
  fait: [
    '{joueur} reprend son souffle.',
    'Le rythme retombe un instant.',
    '{joueur} encourage ses coéquipiers.',
  ],
}

export const REGLAGES: Record<string, ReglagesSport> = {
  'foot-baton': {
    duree: 90,
    libelleTemps: (v) => `${v}'`,
    nomPoint: 'but',
    point: [
      '{joueur} ajuste le gardien : but !',
      'Frappe enroulée de {joueur}, ça fait mouche.',
      '{joueur} pousse le ballon au fond après un une-deux.',
      'Contre éclair conclu par {joueur} !',
    ],
    occasion: [
      '{joueur} trouve le poteau, quelle malchance.',
      'Le gardien détourne la tentative de {joueur}.',
      '{joueur} arme, mais ça passe largement au-dessus.',
    ],
    fait: [
      '{joueur} récupère un ballon précieux au milieu.',
      'Faute de {joueur}, coup franc sans conséquence.',
      'Le jeu se durcit au milieu de terrain.',
    ],
  },

  'basket-baton': {
    duree: 40,
    libelleTemps: (v) => `${v}'`,
    nomPoint: 'panier',
    point: [
      '{joueur} monte au dunk : ça rentre !',
      'Trois points pour {joueur}, main sur la ficelle.',
      '{joueur} déborde et dépose le ballon en douceur.',
    ],
    occasion: [
      'Le tir de {joueur} tourne sur le cercle et ressort.',
      'Contre spectaculaire sur la tentative de {joueur} !',
      '{joueur} perd le ballon avant la ligne.',
    ],
    fait: [
      '{joueur} prend un rebond offensif décisif.',
      'Temps mort demandé, ça discute sur le banc.',
      '{joueur} écope d’une faute.',
    ],
  },

  'sprint-baton': {
    duree: 100,
    libelleTemps: (v) => `${v} m`,
    nomPoint: 'segment',
    point: [
      '{joueur} accélère et prend la tête.',
      'Foulée parfaite de {joueur}, il creuse l’écart.',
      '{joueur} lâche tout et grignote du terrain.',
    ],
    occasion: [
      'Les deux bâtons restent à la même hauteur.',
      '{joueur} tente de relancer, sans écart au chrono.',
      'Rien ne se dessine sur ce segment.',
    ],
    fait: [
      '{joueur} garde une foulée régulière.',
      'La fatigue commence à se voir.',
      '{joueur} jette un œil sur le côté.',
    ],
  },

  'sumo-baton': {
    duree: 7,
    libelleTemps: (v) => `manche ${v}`,
    nomPoint: 'manche',
    point: [
      '{joueur} pousse et sort son adversaire du cercle !',
      'Prise basse de {joueur}, manche remportée.',
      '{joueur} encaisse puis renverse tout : manche pour lui.',
    ],
    occasion: [
      'Les deux bâtons se bloquent, manche nulle.',
      '{joueur} glisse au mauvais moment, personne ne prend l’avantage.',
      'Corps à corps interminable, aucun gagnant.',
    ],
    fait: [
      '{joueur} frappe le sol pour s’ancrer.',
      'Le public retient son souffle.',
      '{joueur} ajuste sa garde.',
    ],
  },

  'tir-de-precision': {
    duree: 10,
    libelleTemps: (v) => `volée ${v}`,
    nomPoint: 'mouche',
    point: [
      '{joueur} plante la flèche en plein centre.',
      'Respiration maîtrisée : {joueur} fait mouche.',
      '{joueur} enchaîne un tir parfait.',
    ],
    occasion: [
      '{joueur} mord la ligne, rien de compté.',
      'Un souffle de vent détourne le tir de {joueur}.',
      '{joueur} hésite trop longtemps et manque la cible.',
    ],
    fait: [
      '{joueur} recorde son arc.',
      'Silence complet sur le pas de tir.',
      '{joueur} respire un grand coup.',
    ],
  },

  'course-d-obstacles': {
    duree: 9,
    libelleTemps: (v) => `obstacle ${v}`,
    nomPoint: 'obstacle',
    point: [
      '{joueur} franchit le mur d’un seul élan.',
      'Passage impeccable de {joueur} sur les pneus.',
      '{joueur} grimpe à la corde sans ralentir.',
    ],
    occasion: [
      '{joueur} bute sur l’obstacle et doit recommencer.',
      'Les deux camps passent en même temps.',
      '{joueur} glisse dans la boue, temps perdu.',
    ],
    fait: [
      '{joueur} secoue les bras pour se relâcher.',
      'Le sable ralentit tout le monde.',
      '{joueur} prend un peu d’avance au ravitaillement.',
    ],
  },

  'balle-au-prisonnier': {
    duree: 12,
    libelleTemps: (v) => `${v}'`,
    nomPoint: 'élimination',
    point: [
      '{joueur} vise juste et élimine un adversaire !',
      'Tir tendu de {joueur}, personne ne l’a vu venir.',
      '{joueur} feinte puis frappe : un de moins en face.',
    ],
    occasion: [
      '{joueur} envoie la balle dans le décor.',
      'Esquive parfaite en face, le tir de {joueur} ne donne rien.',
      'La balle est interceptée avant l’impact.',
    ],
    fait: [
      '{joueur} récupère une balle au sol.',
      'Repli défensif général.',
      '{joueur} sert de leurre pour ses coéquipiers.',
    ],
  },

  'relais-4-100': {
    duree: 4,
    libelleTemps: (v) => `relais ${v}`,
    nomPoint: 'relais',
    point: [
      'Passage de témoin parfait, {joueur} prend l’avantage.',
      '{joueur} explose son relais et double tout le monde.',
      'Transmission propre : {joueur} fait la différence.',
    ],
    occasion: [
      'Témoin hésitant, {joueur} ne gagne rien.',
      'Les deux relais partent exactement ensemble.',
      '{joueur} manque de peu la zone de transmission.',
    ],
    fait: [
      '{joueur} se place dans sa zone.',
      'Les starting-blocks sont réglés.',
      '{joueur} garde son couloir.',
    ],
  },
}

export function reglagesSport(slug: string | null | undefined): ReglagesSport {
  return (slug && REGLAGES[slug]) || GENERIQUE
}

/** Remplit les {joueur} / {adversaire} d'un modèle. */
export function remplir(modele: string, valeurs: Record<string, string>) {
  return modele.replace(/\{(\w+)\}/g, (_, cle: string) => valeurs[cle] ?? '')
}
