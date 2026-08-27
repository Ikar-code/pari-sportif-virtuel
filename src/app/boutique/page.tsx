import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { Coins, Sparkles } from 'lucide-react'
import { getCosmetiques, getInventaire, getSession, getTenue } from '@/lib/queries'
import { BoutiqueGrille } from '@/components/boutique-grille'
import { Carte, LienBouton } from '@/components/ui'
import { formatJetons } from '@/lib/utils'

export const metadata: Metadata = { title: 'Boutique' }
export const dynamic = 'force-dynamic'

export default async function PageBoutique() {
  const session = await getSession()
  if (!session) redirect('/login?suivant=/boutique')
  if (!session.avatar) redirect('/avatar')

  const [cosmetiques, possedes, tenue] = await Promise.all([
    getCosmetiques(),
    getInventaire(session.profil.id),
    getTenue(session.avatar.id),
  ])

  return (
    <div className="container space-y-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 font-display text-3xl font-bold sm:text-4xl">
            <Sparkles className="h-8 w-8 text-cyan" aria-hidden />
            Boutique
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Purement cosmétique : rien ici n’améliore les statistiques de votre bonhomme, ni ses
            chances de gagner. C’est du style, pas de l’avantage.
          </p>
        </div>

        <Carte className="flex items-center gap-3 px-4 py-3">
          <Coins className="h-5 w-5 text-jeton" aria-hidden />
          <div>
            <p className="text-xs text-muted-foreground">Votre solde</p>
            <p className="font-display text-xl font-bold tabular-nums text-jeton">
              {formatJetons(session.profil.solde)}
            </p>
          </div>
        </Carte>
      </header>

      <BoutiqueGrille
        cosmetiques={cosmetiques}
        possedes={possedes}
        solde={Number(session.profil.solde)}
        apparence={session.avatar}
        tenue={tenue}
      />

      <p className="text-sm text-muted-foreground">
        Une fois acheté, un article s’équipe depuis{' '}
        <LienBouton href="/avatar" variante="fantome" taille="sm" className="px-1">
          votre vestiaire
        </LienBouton>
        .
      </p>
    </div>
  )
}
