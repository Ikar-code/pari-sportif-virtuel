'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Coins, Menu, X } from 'lucide-react'
import { cn, formatJetons } from '@/lib/utils'

const LIENS = [
  { href: '/', label: 'Accueil', prive: false },
  { href: '/matchs', label: 'Matchs', prive: false },
  { href: '/jouer', label: 'Jouer', prive: true },
  { href: '/boutique', label: 'Boutique', prive: true },
  { href: '/classement', label: 'Classement', prive: false },
  { href: '/avatar', label: 'Mon avatar', prive: true },
  { href: '/portefeuille', label: 'Portefeuille', prive: true },
  { href: '/profil', label: 'Mon profil', prive: true },
]

export function MenuMobile({ connecte, solde }: { connecte: boolean; solde: number }) {
  const [ouvert, setOuvert] = useState(false)
  const chemin = usePathname()

  useEffect(() => setOuvert(false), [chemin])

  useEffect(() => {
    const surEchap = (e: KeyboardEvent) => e.key === 'Escape' && setOuvert(false)
    window.addEventListener('keydown', surEchap)
    return () => window.removeEventListener('keydown', surEchap)
  }, [])

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        aria-expanded={ouvert}
        aria-label={ouvert ? 'Fermer le menu' : 'Ouvrir le menu'}
        className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card"
      >
        {ouvert ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {ouvert && (
        <div className="fixed inset-0 top-16 z-50 overflow-y-auto bg-background/95 backdrop-blur">
          <nav className="container flex flex-col gap-1 py-6">
            {connecte && (
              <div className="mb-3 flex items-center justify-between rounded-lg border border-jeton/30 bg-jeton/10 px-4 py-3">
                <span className="text-sm font-medium text-jeton">Mon solde</span>
                <span className="flex items-center gap-1.5 font-display text-lg font-bold text-jeton tabular-nums">
                  <Coins className="h-4 w-4" aria-hidden />
                  {formatJetons(solde)}
                </span>
              </div>
            )}

            {LIENS.filter((l) => connecte || !l.prive).map((lien) => (
              <Link
                key={lien.href}
                href={lien.href}
                className={cn(
                  'rounded-lg px-4 py-3 text-base font-medium transition-colors',
                  chemin === lien.href ? 'bg-neon/10 text-neon' : 'hover:bg-muted',
                )}
              >
                {lien.label}
              </Link>
            ))}

            {!connecte && (
              <Link
                href="/login"
                className="mt-3 rounded-lg bg-neon px-4 py-3 text-center font-medium text-neon-foreground"
              >
                Se connecter
              </Link>
            )}
          </nav>
        </div>
      )}
    </div>
  )
}
