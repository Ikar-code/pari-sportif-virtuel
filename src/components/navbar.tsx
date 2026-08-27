import Link from 'next/link'
import { Coins, LogIn, Swords, Trophy } from 'lucide-react'
import { getSession, getTenue } from '@/lib/queries'
import { LienBouton } from '@/components/ui'
import { Vignette } from '@/components/bonhomme'
import { BasculeTheme } from '@/components/bascule-theme'
import { MenuMobile } from '@/components/menu-mobile'
import { formatJetons, NOM_DU_JEU } from '@/lib/utils'

export const LIENS_NAV = [
  { href: '/matchs', label: 'Matchs' },
  { href: '/jouer', label: 'Jouer' },
  { href: '/boutique', label: 'Boutique' },
  { href: '/classement', label: 'Classement' },
]

export async function Navbar() {
  const session = await getSession()
  const tenue = session?.avatar ? await getTenue(session.avatar.id) : undefined

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container flex h-16 items-center gap-3">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span
            className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-neon to-cyan text-lg text-white"
            aria-hidden
          >
            <Swords className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-bold leading-none tracking-tight">
            {NOM_DU_JEU.split(' ')[0]}
            <span className="text-neon"> {NOM_DU_JEU.split(' ').slice(1).join(' ')}</span>
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {LIENS_NAV.map((lien) => (
            <Link
              key={lien.href}
              href={lien.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {lien.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {session && (
            <Link
              href="/portefeuille"
              className="hidden items-center gap-1.5 rounded-lg border border-jeton/30 bg-jeton/10 px-3 py-1.5 text-sm font-semibold text-jeton transition-colors hover:bg-jeton/20 sm:flex"
              title="Mon portefeuille"
            >
              <Coins className="h-4 w-4" aria-hidden />
              <span className="tabular-nums">{formatJetons(session.profil.solde)}</span>
            </Link>
          )}

          <BasculeTheme />

          {session ? (
            <>
              <LienBouton href="/jouer" taille="sm" className="hidden sm:inline-flex">
                <Trophy className="h-4 w-4" aria-hidden />
                Chercher un match
              </LienBouton>
              <Link
                href="/profil"
                className="rounded-full ring-offset-background transition-shadow hover:ring-2 hover:ring-ring hover:ring-offset-2"
                title={session.profil.pseudo}
              >
                {session.avatar ? (
                  <Vignette apparence={session.avatar} tenue={tenue} taille={36} />
                ) : (
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-muted text-sm font-semibold">
                    {session.profil.pseudo.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <span className="sr-only">Mon profil</span>
              </Link>
            </>
          ) : (
            <LienBouton href="/login" taille="sm">
              <LogIn className="h-4 w-4" aria-hidden />
              Connexion
            </LienBouton>
          )}

          <MenuMobile connecte={Boolean(session)} solde={session?.profil.solde ?? 0} />
        </div>
      </div>
    </header>
  )
}
