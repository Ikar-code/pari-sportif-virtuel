/**
 * Types métier de Bâton Arena.
 * Écrits à la main pour rester lisibles ; regénérables avec `npm run db:types`.
 */

export type RoleUtilisateur = 'joueur' | 'admin'
export type StatutMatch = 'a_venir' | 'en_cours' | 'termine' | 'annule'
export type StatutPari = 'en_attente' | 'gagne' | 'perdu' | 'rembourse'
export type CategorieCosmetique = 'chapeau' | 'visage' | 'accessoire' | 'cape' | 'aura'
export type Rarete = 'commun' | 'rare' | 'epique' | 'legendaire'
export type Camp = 'A' | 'B'
export type Format = 1 | 2 | 4

export type TypeTransaction =
  | 'bonus_inscription'
  | 'bonus_quotidien'
  | 'mise'
  | 'gain'
  | 'remboursement'
  | 'achat_boutique'
  | 'prime_victoire'

/** Les cinq statistiques d'un bonhomme bâton. */
export type Stats = {
  vitesse: number
  puissance: number
  technique: number
  endurance: number
  mental: number
}

export const CLES_STATS = ['vitesse', 'puissance', 'technique', 'endurance', 'mental'] as const
export type CleStat = (typeof CLES_STATS)[number]

export type Profil = {
  id: string
  pseudo: string
  email: string | null
  avatar_url: string | null
  solde: number
  role: RoleUtilisateur
  dernier_bonus_at: string | null
  created_at: string
  updated_at: string
}

export type Avatar = Stats & {
  id: string
  proprietaire_id: string | null
  nom: string
  couleur_corps: string
  couleur_tete: string
  couleur_accent: string
  points_libres: number
  niveau: number
  xp: number
  elo: number
  victoires: number
  defaites: number
  est_bot: boolean
  created_at: string
  updated_at: string
}

export type Sport = {
  id: string
  nom: string
  slug: string | null
  icone: string
  description: string | null
  /** Pondération des stats, la somme vaut 1. */
  poids: Stats
  nb_actions: number
  formats: number[]
  actif: boolean
  created_at: string
}

export type Cosmetique = {
  id: string
  nom: string
  slug: string | null
  categorie: CategorieCosmetique
  rarete: Rarete
  prix: number
  donnees: { forme?: string; couleur?: string }
  description: string | null
  actif: boolean
  created_at: string
}

export type Match = {
  id: string
  sport_id: string
  format: Format
  statut: StatutMatch
  seed: number
  date_coup_envoi: string
  date_fin: string | null
  score_a: number | null
  score_b: number | null
  mvp_avatar_id: string | null
  proba_a: number
  cote_a: number
  cote_b: number
  created_at: string
  updated_at: string
}

/** Ligne de la vue `v_matchs`. */
export type MatchDetaille = Match & {
  sport_nom: string
  sport_slug: string | null
  sport_icone: string
  nb_paris: number
  total_mise: number
  statut_effectif: StatutMatch
}

/** Ligne de la vue `v_participants` : tout ce qu'il faut pour dessiner un avatar. */
export type Participant = Stats & {
  id: string
  match_id: string
  camp: Camp
  avatar_id: string
  avatar_nom: string
  couleur_corps: string
  couleur_tete: string
  couleur_accent: string
  niveau: number
  elo: number
  est_bot: boolean
  proprietaire_id: string | null
  proprietaire_pseudo: string | null
}

export type EvenementMatch = {
  id: string
  match_id: string
  ordre: number
  minute: number
  type: string
  camp: Camp | null
  avatar_id: string | null
  texte: string
}

export type Pari = {
  id: string
  match_id: string
  parieur_id: string
  camp: Camp
  mise: number
  cote: number
  gain_potentiel: number
  statut: StatutPari
  gain_reel: number
  created_at: string
  regle_at: string | null
}

export type Transaction = {
  id: string
  profil_id: string
  type: TypeTransaction
  montant: number
  solde_apres: number
  libelle: string
  reference_id: string | null
  created_at: string
}

/** Ligne de la vue `v_classement`. */
export type LigneClassement = {
  avatar_id: string
  nom: string
  elo: number
  niveau: number
  victoires: number
  defaites: number
  couleur_corps: string
  couleur_tete: string
  couleur_accent: string
  est_bot: boolean
  proprietaire_id: string | null
  proprietaire_pseudo: string | null
  taux_victoire: number
}

/** Cosmétiques équipés, par emplacement. */
export type Tenue = Partial<Record<CategorieCosmetique, Cosmetique>>

/** Retour standard des Server Actions, consommé par `useActionState`. */
export type EtatAction = {
  ok: boolean
  message: string
} | null
