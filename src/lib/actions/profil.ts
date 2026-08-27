'use server'

import { revalidatePath } from 'next/cache'
import { creerClientServeur } from '@/lib/supabase/server'
import { champ } from '@/lib/utils'
import type { EtatAction } from '@/lib/types'

/** Le pseudo est la seule chose modifiable du profil : le solde vient du jeu. */
export async function modifierPseudo(_prec: EtatAction, formData: FormData): Promise<EtatAction> {
  const pseudo = champ(formData, 'pseudo')
  if (pseudo.length < 3) {
    return { ok: false, message: 'Le pseudo doit faire au moins 3 caractères.' }
  }

  const supabase = await creerClientServeur()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'Vous devez être connecté.' }

  const { error } = await supabase.from('profiles').update({ pseudo }).eq('id', user.id)

  if (error) {
    if (error.code === '23505') return { ok: false, message: 'Ce pseudo est déjà pris.' }
    return { ok: false, message: `Enregistrement impossible : ${error.message}` }
  }

  revalidatePath('/profil')
  revalidatePath('/', 'layout')
  return { ok: true, message: 'Pseudo mis à jour.' }
}
