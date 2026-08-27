import { NextResponse, type NextRequest } from 'next/server'
import { creerClientServeur } from '@/lib/supabase/server'

/**
 * Retour des connexions Google et des liens de confirmation d'e-mail :
 * on échange le code contre une session, puis on renvoie dans l'app.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const suivant = searchParams.get('next') ?? '/avatar'

  if (code) {
    const supabase = await creerClientServeur()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${suivant}`)
  }

  return NextResponse.redirect(`${origin}/login?erreur=lien_invalide`)
}
