'use server'

import { revalidatePath } from 'next/cache'
import { creerClientServeur } from '@/lib/supabase/server'
import { champ, champNombre } from '@/lib/utils'
import type { EtatAction } from '@/lib/types'

/**
 * Place un pari.
 *
 * Toute la logique sensible (solde suffisant, paris encore ouverts, débit)
 * vit dans la fonction SQL placer_pari : elle s'exécute en une transaction,
 * ce qui évite qu'un double clic ne mise deux fois le même solde.
 */
export async function parier(_prec: EtatAction, formData: FormData): Promise<EtatAction> {
  const matchId = champ(formData, 'match_id')
  const camp = champ(formData, 'camp')
  const mise = champNombre(formData, 'mise')

  if (!matchId) return { ok: false, message: 'Match introuvable.' }
  if (camp !== 'A' && camp !== 'B') return { ok: false, message: 'Choisissez un camp.' }
  if (mise === null || mise < 10) return { ok: false, message: 'La mise minimale est de 10 jetons.' }

  const supabase = await creerClientServeur()
  const { data, error } = await supabase.rpc('placer_pari', {
    p_match: matchId,
    p_camp: camp,
    p_mise: mise,
  })

  if (error) return { ok: false, message: error.message }

  const reponse = data as { ok: boolean; message: string }
  if (reponse?.ok) {
    revalidatePath(`/matchs/${matchId}`)
    revalidatePath('/portefeuille')
    revalidatePath('/', 'layout')
  }

  return { ok: Boolean(reponse?.ok), message: reponse?.message ?? 'Erreur inattendue.' }
}
