'use server'

import { revalidatePath } from 'next/cache'
import { creerClientServeur } from '@/lib/supabase/server'
import { champ } from '@/lib/utils'
import type { EtatAction } from '@/lib/types'

/** Achat d'un cosmétique — débit et ajout à l'inventaire en une transaction SQL. */
export async function acheterCosmetique(
  _prec: EtatAction,
  formData: FormData,
): Promise<EtatAction> {
  const cosmetiqueId = champ(formData, 'cosmetique_id')
  if (!cosmetiqueId) return { ok: false, message: 'Article introuvable.' }

  const supabase = await creerClientServeur()
  const { data, error } = await supabase.rpc('acheter_cosmetique', {
    p_cosmetique: cosmetiqueId,
  })

  if (error) return { ok: false, message: error.message }

  const reponse = data as { ok: boolean; message: string }
  if (reponse?.ok) {
    revalidatePath('/boutique')
    revalidatePath('/avatar')
    revalidatePath('/', 'layout')
  }

  return { ok: Boolean(reponse?.ok), message: reponse?.message ?? 'Erreur inattendue.' }
}

/** Bonus quotidien : 250 jetons toutes les 20 heures. */
export async function reclamerBonus(_prec: EtatAction): Promise<EtatAction> {
  const supabase = await creerClientServeur()
  const { data, error } = await supabase.rpc('reclamer_bonus_quotidien')

  if (error) return { ok: false, message: error.message }

  const reponse = data as { ok: boolean; message: string }
  if (reponse?.ok) {
    revalidatePath('/portefeuille')
    revalidatePath('/', 'layout')
  }

  return { ok: Boolean(reponse?.ok), message: reponse?.message ?? 'Erreur inattendue.' }
}
