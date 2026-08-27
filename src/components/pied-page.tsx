import Link from 'next/link'
import { Info } from 'lucide-react'
import { NOM_DU_JEU } from '@/lib/utils'

export function PiedPage() {
  return (
    <footer className="mt-16 border-t border-border bg-muted/40">
      <div className="container flex flex-col gap-6 py-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-md space-y-3">
          <p className="font-display text-base font-bold">{NOM_DU_JEU}</p>
          <p className="text-sm text-muted-foreground">
            Créez votre bonhomme bâton, envoyez-le en arène et pariez sur l’issue des matchs
            simulés.
          </p>

          {/* Le point le plus important du site : autant le dire clairement. */}
          <p className="flex gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-cyan" aria-hidden />
            <span>
              Les jetons sont une monnaie <strong className="text-foreground">100 % fictive</strong>.
              Aucun achat, aucun retrait, aucune valeur réelle : c’est un jeu, pas un site
              d’argent.
            </span>
          </p>
        </div>

        <nav className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm">
          <Link href="/matchs" className="lien-discret">Matchs</Link>
          <Link href="/jouer" className="lien-discret">Chercher un match</Link>
          <Link href="/classement" className="lien-discret">Classement</Link>
          <Link href="/boutique" className="lien-discret">Boutique</Link>
          <Link href="/avatar" className="lien-discret">Mon avatar</Link>
          <Link href="/portefeuille" className="lien-discret">Portefeuille</Link>
        </nav>
      </div>

      <div className="border-t border-border py-4">
        <p className="container text-xs text-muted-foreground">
          © {new Date().getFullYear()} {NOM_DU_JEU} — monnaie fictive, zéro euro impliqué.
        </p>
      </div>
    </footer>
  )
}
