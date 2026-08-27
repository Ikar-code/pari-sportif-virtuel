import 'server-only'
import { creerClientServeur } from './supabase/server'
import type {
  Avatar,
  Cosmetique,
  EvenementMatch,
  LigneClassement,
  Match,
  MatchDetaille,
  Pari,
  Participant,
  Profil,
  Sport,
  StatutMatch,
  Tenue,
  Transaction,
} from './types'

/* ==========================================================================
   Session
   ========================================================================== */

export type Session = {
  user: { id: string; email?: string }
  profil: Profil
  avatar: Avatar | null
}

/**
 * Utilisateur connecté, son profil et son avatar.
 * Les erreurs sont absorbées : une panne Supabase doit dégrader la navigation
 * en « visiteur », pas faire tomber la page.
 */
export async function getSession(): Promise<Session | null> {
  try {
    const supabase = await creerClientServeur()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const [{ data: profil }, { data: avatar }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('avatars').select('*').eq('proprietaire_id', user.id).maybeSingle(),
    ])

    if (!profil) return null
    return {
      user: { id: user.id, email: user.email },
      profil: profil as Profil,
      avatar: (avatar as Avatar) ?? null,
    }
  } catch (erreur) {
    if (estSignalNext(erreur)) throw erreur
    console.error('[getSession]', erreur)
    return null
  }
}

/** Next signale le rendu dynamique par une erreur à digest : il faut la laisser passer. */
function estSignalNext(erreur: unknown) {
  const digest = (erreur as { digest?: unknown })?.digest
  return typeof digest === 'string' && (digest.startsWith('NEXT_') || digest.includes('DYNAMIC'))
}

/* ==========================================================================
   Catalogue
   ========================================================================== */

export async function getSports(): Promise<Sport[]> {
  const supabase = await creerClientServeur()
  const { data } = await supabase.from('sports').select('*').eq('actif', true).order('nom')
  return (data ?? []) as Sport[]
}

export async function getSport(id: string): Promise<Sport | null> {
  const supabase = await creerClientServeur()
  const { data } = await supabase.from('sports').select('*').eq('id', id).maybeSingle()
  return (data as Sport) ?? null
}

export async function getCosmetiques(): Promise<Cosmetique[]> {
  const supabase = await creerClientServeur()
  const { data } = await supabase
    .from('cosmetiques')
    .select('*')
    .eq('actif', true)
    .order('prix')
  return (data ?? []) as Cosmetique[]
}

/* ==========================================================================
   Matchs
   ========================================================================== */

export type FiltresMatchs = {
  statut?: string
  sport?: string
  limite?: number
  ordre?: 'asc' | 'desc'
}

export async function getMatchs(filtres: FiltresMatchs = {}): Promise<MatchDetaille[]> {
  const supabase = await creerClientServeur()
  let requete = supabase.from('v_matchs').select('*')

  if (filtres.statut) requete = requete.eq('statut_effectif', filtres.statut)
  if (filtres.sport) requete = requete.eq('sport_slug', filtres.sport)

  requete = requete.order('date_coup_envoi', { ascending: filtres.ordre === 'asc' })
  if (filtres.limite) requete = requete.limit(filtres.limite)

  const { data, error } = await requete
  if (error) {
    console.error('[getMatchs]', error.message)
    return []
  }
  return (data ?? []) as MatchDetaille[]
}

export async function getMatch(id: string): Promise<MatchDetaille | null> {
  const supabase = await creerClientServeur()
  const { data } = await supabase.from('v_matchs').select('*').eq('id', id).maybeSingle()
  return (data as MatchDetaille) ?? null
}

export async function getParticipants(matchId: string): Promise<Participant[]> {
  const supabase = await creerClientServeur()
  const { data } = await supabase
    .from('v_participants')
    .select('*')
    .eq('match_id', matchId)
    .order('camp')
  return (data ?? []) as Participant[]
}

/** Participants de plusieurs matchs d'un coup — évite une requête par carte. */
export async function getParticipantsPourMatchs(
  matchIds: string[],
): Promise<Record<string, Participant[]>> {
  if (!matchIds.length) return {}
  const supabase = await creerClientServeur()
  const { data } = await supabase.from('v_participants').select('*').in('match_id', matchIds)

  const parMatch: Record<string, Participant[]> = {}
  for (const p of (data ?? []) as Participant[]) {
    parMatch[p.match_id] ??= []
    parMatch[p.match_id].push(p)
  }
  return parMatch
}

export async function getEvenements(matchId: string): Promise<EvenementMatch[]> {
  const supabase = await creerClientServeur()
  const { data } = await supabase
    .from('evenements_match')
    .select('*')
    .eq('match_id', matchId)
    .order('ordre')
  return (data ?? []) as EvenementMatch[]
}

/** Les matchs auxquels l'avatar du joueur participe. */
export async function getMesMatchs(avatarId: string, limite = 20): Promise<MatchDetaille[]> {
  const supabase = await creerClientServeur()
  const { data: liens } = await supabase
    .from('participants_match')
    .select('match_id')
    .eq('avatar_id', avatarId)

  const ids = (liens ?? []).map((l: { match_id: string }) => l.match_id)
  if (!ids.length) return []

  const { data } = await supabase
    .from('v_matchs')
    .select('*')
    .in('id', ids)
    .order('date_coup_envoi', { ascending: false })
    .limit(limite)

  return (data ?? []) as MatchDetaille[]
}

/* ==========================================================================
   Paris & portefeuille
   ========================================================================== */

export async function getMonPari(matchId: string, profilId: string): Promise<Pari | null> {
  const supabase = await creerClientServeur()
  const { data } = await supabase
    .from('paris')
    .select('*')
    .eq('match_id', matchId)
    .eq('parieur_id', profilId)
    .maybeSingle()
  return (data as Pari) ?? null
}

export type PariDetaille = Pari & {
  matchs:
    | (Pick<Match, 'id' | 'score_a' | 'score_b' | 'statut' | 'date_coup_envoi'> & {
        sports: Pick<Sport, 'nom' | 'icone'> | null
      })
    | null
}

export async function getMesParis(profilId: string, limite = 50): Promise<PariDetaille[]> {
  const supabase = await creerClientServeur()
  const { data } = await supabase
    .from('paris')
    .select(
      '*, matchs ( id, score_a, score_b, statut, date_coup_envoi, sports ( nom, icone ) )',
    )
    .eq('parieur_id', profilId)
    .order('created_at', { ascending: false })
    .limit(limite)
  return (data ?? []) as unknown as PariDetaille[]
}

export async function getTransactions(profilId: string, limite = 60): Promise<Transaction[]> {
  const supabase = await creerClientServeur()
  const { data } = await supabase
    .from('transactions')
    .select('*')
    .eq('profil_id', profilId)
    .order('created_at', { ascending: false })
    .limit(limite)
  return (data ?? []) as Transaction[]
}

/** Bilan du portefeuille : ce qui est misé, gagné, perdu. */
export async function getBilan(profilId: string) {
  const supabase = await creerClientServeur()
  const { data } = await supabase
    .from('paris')
    .select('mise, gain_reel, statut')
    .eq('parieur_id', profilId)

  const paris = (data ?? []) as Pick<Pari, 'mise' | 'gain_reel' | 'statut'>[]

  const totalMise = paris.reduce((s, p) => s + Number(p.mise), 0)
  const totalGains = paris.reduce((s, p) => s + Number(p.gain_reel), 0)
  const regles = paris.filter((p) => p.statut !== 'en_attente')

  return {
    nbParis: paris.length,
    nbEnAttente: paris.length - regles.length,
    nbGagnes: paris.filter((p) => p.statut === 'gagne').length,
    totalMise,
    totalGains,
    resultatNet: totalGains - totalMise,
    tauxReussite: regles.length
      ? paris.filter((p) => p.statut === 'gagne').length / regles.length
      : 0,
  }
}

/* ==========================================================================
   Inventaire & tenue
   ========================================================================== */

export async function getInventaire(profilId: string): Promise<string[]> {
  const supabase = await creerClientServeur()
  const { data } = await supabase
    .from('inventaires')
    .select('cosmetique_id')
    .eq('profil_id', profilId)
  return (data ?? []).map((l: { cosmetique_id: string }) => l.cosmetique_id)
}

/** Les cosmétiques équipés d'un avatar, indexés par emplacement. */
export async function getTenue(avatarId: string): Promise<Tenue> {
  const supabase = await creerClientServeur()
  const { data } = await supabase
    .from('equipements')
    .select('categorie, cosmetiques ( * )')
    .eq('avatar_id', avatarId)

  const tenue: Tenue = {}
  for (const ligne of (data ?? []) as unknown as {
    categorie: keyof Tenue
    cosmetiques: Cosmetique | null
  }[]) {
    if (ligne.cosmetiques) tenue[ligne.categorie] = ligne.cosmetiques
  }
  return tenue
}

/** Tenues de plusieurs avatars d'un coup — évite N requêtes sur une fiche match. */
export async function getTenues(avatarIds: string[]): Promise<Record<string, Tenue>> {
  if (!avatarIds.length) return {}
  const supabase = await creerClientServeur()
  const { data } = await supabase
    .from('equipements')
    .select('avatar_id, categorie, cosmetiques ( * )')
    .in('avatar_id', avatarIds)

  const parAvatar: Record<string, Tenue> = {}
  for (const ligne of (data ?? []) as unknown as {
    avatar_id: string
    categorie: keyof Tenue
    cosmetiques: Cosmetique | null
  }[]) {
    if (!ligne.cosmetiques) continue
    parAvatar[ligne.avatar_id] ??= {}
    parAvatar[ligne.avatar_id][ligne.categorie] = ligne.cosmetiques
  }
  return parAvatar
}

/* ==========================================================================
   Classement & recherche en cours
   ========================================================================== */

export async function getClassement(limite = 50, humainsSeulement = false) {
  const supabase = await creerClientServeur()
  let requete = supabase.from('v_classement').select('*')
  if (humainsSeulement) requete = requete.eq('est_bot', false)

  const { data } = await requete.order('elo', { ascending: false }).limit(limite)
  return (data ?? []) as LigneClassement[]
}

export async function getRechercheEnCours(profilId: string) {
  const supabase = await creerClientServeur()
  const { data } = await supabase
    .from('file_attente')
    .select('*, sports ( nom, icone )')
    .eq('profil_id', profilId)
    .maybeSingle()
  return data as
    | {
        profil_id: string
        avatar_id: string
        sport_id: string
        format: number
        elo: number
        created_at: string
        sports: { nom: string; icone: string } | null
      }
    | null
}

/* ==========================================================================
   Accueil
   ========================================================================== */

export async function getStatsAccueil() {
  const supabase = await creerClientServeur()
  const [joueurs, matchs, sports] = await Promise.all([
    supabase.from('avatars').select('id', { count: 'exact', head: true }).eq('est_bot', false),
    supabase
      .from('matchs')
      .select('id', { count: 'exact', head: true })
      .eq('statut', 'termine' satisfies StatutMatch),
    supabase.from('sports').select('id', { count: 'exact', head: true }).eq('actif', true),
  ])

  return {
    joueurs: joueurs.count ?? 0,
    matchsJoues: matchs.count ?? 0,
    sports: sports.count ?? 0,
  }
}
