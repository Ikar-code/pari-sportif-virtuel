'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { creerClientServeur } from '@/lib/supabase/server'
import { enregistrerCotes } from '@/lib/simulation/executer'
import { champNombre, champ } from '@/lib/utils'
import type { EtatAction } from '@/lib/types'

/**
 * Lance une recherche de match.
 *
 * La tolérance d'elo s'élargit avec le temps d'attente : on cherche d'abord un
 * adversaire de niveau très proche, puis on ouvre progressivement. Passé un
 * certain délai (ou tout de suite si le joueur le demande), on accepte les
 * adversaires gérés par la machine — sinon une arène vide serait injouable.
 */
export async function lancerRecherche(_prec: EtatAction, formData: FormData): Promise<EtatAction> {
  const sportId = champ(formData, 'sport_id')
  const format = champNombre(formData, 'format') ?? 1
  const attenteSecondes = champNombre(formData, 'attente') ?? 0
  const autoriserBots = formData.get('bots') !== null

  if (!sportId) return { ok: false, message: 'Choisissez une discipline.' }
  if (![1, 2, 4].includes(format)) return { ok: false, message: 'Format invalide.' }

  const supabase = await creerClientServeur()

  const { data, error } = await supabase.rpc('rechercher_match', {
    p_sport: sportId,
    p_format: format,
    p_tolerance: Math.min(600, 120 + attenteSecondes * 12),
    p_autoriser_bots: autoriserBots || attenteSecondes >= 20,
  })

  if (error) return { ok: false, message: error.message }

  if (!data) {
    return { ok: true, message: 'Recherche en cours, aucun adversaire pour le moment…' }
  }

  // Les cotes se calculent en simulant le match plusieurs centaines de fois.
  await enregistrerCotes(data as string)

  revalidatePath('/matchs')
  revalidatePath('/jouer')
  redirect(`/matchs/${data}`)
}

export async function annulerRecherche() {
  const supabase = await creerClientServeur()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('file_attente').delete().eq('profil_id', user.id)
  revalidatePath('/jouer')
}
