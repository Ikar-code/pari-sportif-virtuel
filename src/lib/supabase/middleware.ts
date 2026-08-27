import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/** Pages accessibles uniquement connecté. */
const ROUTES_PRIVEES = ['/avatar', '/jouer', '/portefeuille', '/profil', '/boutique']

/**
 * Rafraîchit le token Supabase à chaque requête et protège les routes privées.
 */
export async function actualiserSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Ne pas retirer : c'est cet appel qui renouvelle le token.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const chemin = request.nextUrl.pathname
  const estPrivee = ROUTES_PRIVEES.some((r) => chemin === r || chemin.startsWith(`${r}/`))

  if (!user && estPrivee) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('suivant', chemin)
    return NextResponse.redirect(url)
  }

  return response
}
