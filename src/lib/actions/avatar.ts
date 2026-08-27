'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { creerClientServeur } from '@/lib/supabase/server'
import { budgetStats, champ, champNombre, STAT_MAX, STAT_MIN } from '@/lib/utils'
import { CLES_STATS, type CategorieCosmetique, type EtatAction, type Stats } from '@/lib/types'

/** Lit et valide les 5 statistiques du formulaire. */
function lireStats(formData: FormData): { stats: Stats; erreur?: string } {
  const stats = {} as Stats

  for (const cle of CLES_STATS) {
    const valeur = champNombre(formData, cle)
    if (valeur === null || !Number.isInteger(valeur)) {
      return { stats, erreur: `La statistique « ${cle} » est invalide.` }
    }
    if (valeur < STAT_MIN || valeur > STAT_MAX) {
      return { stats, erreur: `Chaque statistique doit être comprise entre ${STAT_MIN} et ${STAT_MAX}.` }
    }
    stats[cle] = valeur
  }

  return { stats }
}

export async function creerAvatar(_prec: EtatAction, formData: FormData): Promise<EtatAction> {
  const supabase = await creerClientServeur()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'Vous devez être connecté.' }

  const nom = champ(formData, 'nom')
  if (!nom) return { ok: false, message: 'Donnez un nom à votre bonhomme.' }

  const { stats, erreur } = lireStats(formData)
  if (erreur) return { ok: false, message: erreur }

  const total = CLES_STATS.reduce((s, c) => s + stats[c], 0)
  const budget = budgetStats(1)
  if (total !== budget) {
    return {
      ok: false,
      message: `Il faut répartir exactement ${budget} points (vous en avez placé ${total}).`,
    }
  }

  const { error } = await supabase.from('avatars').insert({
    proprietaire_id: user.id,
    nom,
    couleur_corps: champ(formData, 'couleur_corps') || '#7C5CFF',
    couleur_tete: champ(formData, 'couleur_tete') || '#FFD9A0',
    couleur_accent: champ(formData, 'couleur_accent') || '#22D3EE',
    ...stats,
    points_libres: 0,
  })

  if (error) {
    if (error.code === '23505') {
      return { ok: false, message: 'Vous avez déjà un avatar.' }
    }
    return { ok: false, message: `Création impossible : ${error.message}` }
  }

  revalidatePath('/', 'layout')
  redirect('/jouer')
}

export async function modifierAvatar(_prec: EtatAction, formData: FormData): Promise<EtatAction> {
  const supabase = await creerClientServeur()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'Vous devez être connecté.' }

  const { data: avatar } = await supabase
    .from('avatars')
    .select('id, niveau')
    .eq('proprietaire_id', user.id)
    .maybeSingle()

  if (!avatar) return { ok: false, message: 'Aucun avatar à modifier.' }

  const nom = champ(formData, 'nom')
  if (!nom) return { ok: false, message: 'Le nom est obligatoire.' }

  const { stats, erreur } = lireStats(formData)
  if (erreur) return { ok: false, message: erreur }

  // Le budget total doit être respecté : ce qui n'est pas placé reste en réserve.
  const total = CLES_STATS.reduce((s, c) => s + stats[c], 0)
  const budget = budgetStats(avatar.niveau)
  if (total > budget) {
    return { ok: false, message: `Vous dépassez votre budget de ${budget} points.` }
  }

  const { error } = await supabase
    .from('avatars')
    .update({
      nom,
      couleur_corps: champ(formData, 'couleur_corps') || '#7C5CFF',
      couleur_tete: champ(formData, 'couleur_tete') || '#FFD9A0',
      couleur_accent: champ(formData, 'couleur_accent') || '#22D3EE',
      ...stats,
      points_libres: budget - total,
    })
    .eq('id', avatar.id)

  if (error) return { ok: false, message: `Enregistrement impossible : ${error.message}` }

  revalidatePath('/avatar')
  revalidatePath('/', 'layout')
  return { ok: true, message: 'Avatar mis à jour.' }
}

/**
 * Équipe ou retire un cosmétique.
 * Le RLS vérifie que l'avatar appartient bien au joueur et qu'il possède l'objet.
 */
export async function equiperCosmetique(formData: FormData) {
  const avatarId = champ(formData, 'avatar_id')
  const categorie = champ(formData, 'categorie') as CategorieCosmetique
  const cosmetiqueId = champ(formData, 'cosmetique_id')

  if (!avatarId || !categorie) return

  const supabase = await creerClientServeur()

  if (!cosmetiqueId) {
    await supabase
      .from('equipements')
      .delete()
      .eq('avatar_id', avatarId)
      .eq('categorie', categorie)
  } else {
    await supabase
      .from('equipements')
      .upsert(
        { avatar_id: avatarId, categorie, cosmetique_id: cosmetiqueId },
        { onConflict: 'avatar_id,categorie' },
      )
  }

  revalidatePath('/avatar')
  revalidatePath('/boutique')
}
