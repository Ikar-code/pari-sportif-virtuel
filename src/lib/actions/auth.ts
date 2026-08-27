'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { creerClientServeur } from '@/lib/supabase/server'
import { champ } from '@/lib/utils'
import type { EtatAction } from '@/lib/types'

async function origine() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}

export async function connexion(_prec: EtatAction, formData: FormData): Promise<EtatAction> {
  const email = champ(formData, 'email')
  const motDePasse = champ(formData, 'mot_de_passe')
  const suivant = champ(formData, 'suivant') || '/'

  if (!email || !motDePasse) {
    return { ok: false, message: 'Renseignez votre e-mail et votre mot de passe.' }
  }

  const supabase = await creerClientServeur()
  const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse })

  if (error) {
    const message =
      error.message === 'Invalid login credentials'
        ? 'E-mail ou mot de passe incorrect.'
        : error.message === 'Email not confirmed'
          ? 'Votre adresse n’est pas encore confirmée. Regardez vos e-mails.'
          : error.message
    return { ok: false, message }
  }

  revalidatePath('/', 'layout')
  redirect(suivant)
}

export async function inscription(_prec: EtatAction, formData: FormData): Promise<EtatAction> {
  const email = champ(formData, 'email')
  const motDePasse = champ(formData, 'mot_de_passe')
  const pseudo = champ(formData, 'pseudo')

  if (!email || !motDePasse || !pseudo) {
    return { ok: false, message: 'Pseudo, e-mail et mot de passe sont obligatoires.' }
  }
  if (pseudo.length < 3) {
    return { ok: false, message: 'Le pseudo doit faire au moins 3 caractères.' }
  }
  if (motDePasse.length < 8) {
    return { ok: false, message: 'Le mot de passe doit faire au moins 8 caractères.' }
  }

  const supabase = await creerClientServeur()
  const { data, error } = await supabase.auth.signUp({
    email,
    password: motDePasse,
    options: {
      emailRedirectTo: `${await origine()}/auth/callback?next=/avatar`,
      data: { pseudo },
    },
  })

  if (error) {
    const message = error.message.includes('already registered')
      ? 'Un compte existe déjà avec cette adresse.'
      : error.message
    return { ok: false, message }
  }

  if (!data.session) {
    return {
      ok: true,
      message: `Compte créé. Un e-mail de confirmation vient de partir vers ${email}.`,
    }
  }

  revalidatePath('/', 'layout')
  redirect('/avatar')
}

/** Connexion via Google : on renvoie l'utilisateur sur l'URL fournie par Supabase. */
export async function connexionGoogle() {
  const supabase = await creerClientServeur()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${await origine()}/auth/callback?next=/avatar`,
      queryParams: { access_type: 'offline', prompt: 'consent' },
    },
  })

  if (error || !data.url) {
    redirect('/login?erreur=google')
  }
  redirect(data.url)
}

export async function deconnexion() {
  const supabase = await creerClientServeur()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}
