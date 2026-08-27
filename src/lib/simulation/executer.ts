import 'server-only'
import { creerClientService } from '@/lib/supabase/admin'
import { calculerCotes } from './cotes'
import { simulerMatch, type AvatarSimule, type ConfigMatch } from './moteur'
import type { Sport, Stats } from '@/lib/types'

/**
 * Orchestration serveur du moteur.
 *
 * Ces fonctions écrivent avec la clé de service, donc hors RLS : c'est
 * volontaire. Le score d'un match, ses cotes et le règlement des paris ne
 * doivent jamais dépendre d'une requête venue du navigateur, sinon un joueur
 * pourrait choisir ses propres résultats.
 */

/** La relation matchs -> sports est typée comme un tableau par le client ; c'en est un seul. */
type SportJoint = { sports: Pick<Sport, 'slug' | 'poids' | 'nb_actions'> | null }

type LigneParticipant = {
  avatar_id: string
  avatar_nom: string
  camp: 'A' | 'B'
  vitesse: number
  puissance: number
  technique: number
  endurance: number
  mental: number
}

function versAvatarSimule(p: LigneParticipant): AvatarSimule {
  return {
    id: p.avatar_id,
    nom: p.avatar_nom,
    vitesse: p.vitesse,
    puissance: p.puissance,
    technique: p.technique,
    endurance: p.endurance,
    mental: p.mental,
  }
}

/** Recharge tout ce qu'il faut pour simuler un match donné. */
async function chargerConfig(
  service: ReturnType<typeof creerClientService>,
  matchId: string,
  seed: number,
  sport: Pick<Sport, 'slug' | 'poids' | 'nb_actions'>,
): Promise<ConfigMatch | null> {
  const { data } = await service
    .from('v_participants')
    .select('avatar_id, avatar_nom, camp, vitesse, puissance, technique, endurance, mental')
    .eq('match_id', matchId)

  const participants = (data ?? []) as LigneParticipant[]
  const equipeA = participants.filter((p) => p.camp === 'A').map(versAvatarSimule)
  const equipeB = participants.filter((p) => p.camp === 'B').map(versAvatarSimule)

  if (!equipeA.length || !equipeB.length) return null

  return {
    seed,
    sportSlug: sport.slug,
    poids: sport.poids as Stats,
    nbActions: sport.nb_actions,
    equipeA,
    equipeB,
  }
}

/**
 * Calcule les cotes d'un match fraîchement créé et les fige.
 * Appelé juste après le matchmaking, avant que les paris n'ouvrent.
 */
export async function enregistrerCotes(matchId: string) {
  const service = creerClientService()

  const { data: match } = await service
    .from('matchs')
    .select('id, seed, sports ( slug, poids, nb_actions )')
    .eq('id', matchId)
    .maybeSingle()

  if (!match) return
  const sport = (match as unknown as SportJoint).sports
  if (!sport) return

  const config = await chargerConfig(service, matchId, Number(match.seed), sport)
  if (!config) return

  const cotes = calculerCotes(config)

  await service
    .from('matchs')
    .update({ proba_a: cotes.probaA, cote_a: cotes.coteA, cote_b: cotes.coteB })
    .eq('id', matchId)
}

/**
 * Joue le match s'il est l'heure, puis règle les paris.
 * Idempotent : plusieurs appels simultanés ne produisent qu'une simulation.
 *
 * @returns true si la simulation vient d'être exécutée.
 */
export async function assurerMatchSimule(matchId: string): Promise<boolean> {
  const service = creerClientService()

  const { data: match } = await service
    .from('matchs')
    .select('id, seed, statut, date_coup_envoi, updated_at, sports ( slug, poids, nb_actions )')
    .eq('id', matchId)
    .maybeSingle()

  if (!match) return false
  if (match.statut === 'termine' || match.statut === 'annule') return false
  if (new Date(match.date_coup_envoi).getTime() > Date.now()) return false

  // Verrou : le passage a_venir -> en_cours n'est gagné que par un seul appel.
  const { data: verrou } = await service
    .from('matchs')
    .update({ statut: 'en_cours' })
    .eq('id', matchId)
    .eq('statut', 'a_venir')
    .select('id')

  const aLeVerrou = Boolean(verrou?.length)

  if (!aLeVerrou) {
    // Un match resté « en cours » plus de 30 secondes vient d'une exécution
    // interrompue : on reprend la main plutôt que de le laisser bloqué.
    const bloqueDepuis = Date.now() - new Date(match.updated_at).getTime()
    if (match.statut !== 'en_cours' || bloqueDepuis < 30_000) return false
  }

  const sport = (match as unknown as SportJoint).sports
  if (!sport) return false

  const config = await chargerConfig(service, matchId, Number(match.seed), sport)
  if (!config) return false

  const resultat = simulerMatch(config)

  // On repart d'une table propre : une reprise après incident ne doit pas
  // laisser deux versions du déroulé.
  await service.from('evenements_match').delete().eq('match_id', matchId)

  await service.from('evenements_match').insert(
    resultat.evenements.map((e) => ({
      match_id: matchId,
      ordre: e.ordre,
      minute: e.minute,
      type: e.type,
      camp: e.camp,
      avatar_id: e.avatarId,
      texte: e.texte,
    })),
  )

  await service
    .from('matchs')
    .update({
      score_a: resultat.scoreA,
      score_b: resultat.scoreB,
      mvp_avatar_id: resultat.mvpId,
      date_fin: new Date().toISOString(),
    })
    .eq('id', matchId)

  // Paiement des paris, elo, expérience : tout se fait côté base, en une transaction.
  const { error } = await service.rpc('regler_match', { p_match: matchId })
  if (error) console.error('[regler_match]', error.message)

  return true
}

/** Passe en revue les matchs dont l'heure est venue (appelé depuis les listes). */
export async function simulerMatchsEnRetard(limite = 8) {
  const service = creerClientService()

  const { data } = await service
    .from('matchs')
    .select('id')
    .in('statut', ['a_venir', 'en_cours'])
    .lte('date_coup_envoi', new Date().toISOString())
    .order('date_coup_envoi')
    .limit(limite)

  for (const ligne of (data ?? []) as { id: string }[]) {
    await assurerMatchSimule(ligne.id)
  }
}
