import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { Shirt, Sparkles } from 'lucide-react'
import { getCosmetiques, getInventaire, getSession, getTenue } from '@/lib/queries'
import { equiperCosmetique } from '@/lib/actions/avatar'
import { EditeurAvatar } from '@/components/editeur-avatar'
import { Badge, Bouton, Carte, LienBouton } from '@/components/ui'
import { cn, COULEUR_RARETE } from '@/lib/utils'
import type { CategorieCosmetique, Tenue } from '@/lib/types'

export const metadata: Metadata = { title: 'Mon avatar' }
export const dynamic = 'force-dynamic'

const EMPLACEMENTS: { cle: CategorieCosmetique; label: string }[] = [
  { cle: 'chapeau', label: 'Chapeau' },
  { cle: 'visage', label: 'Visage' },
  { cle: 'accessoire', label: 'Accessoire' },
  { cle: 'cape', label: 'Cape' },
  { cle: 'aura', label: 'Aura' },
]

export default async function PageAvatar() {
  const session = await getSession()
  if (!session) redirect('/login?suivant=/avatar')

  const [cosmetiques, possedes, tenue] = await Promise.all([
    getCosmetiques(),
    getInventaire(session.profil.id),
    session.avatar ? getTenue(session.avatar.id) : Promise.resolve({} as Tenue),
  ])

  const inventaire = cosmetiques.filter((c) => possedes.includes(c.id))

  return (
    <div className="container space-y-8 py-10">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          {session.avatar ? 'Mon bonhomme' : 'Créez votre bonhomme'}
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          {session.avatar
            ? 'Ajustez son apparence et redistribuez ses points comme vous voulez : le total reste le même, seule la répartition change.'
            : 'Cinq statistiques, un budget de 50 points. C’est cette répartition que le moteur utilisera pour simuler vos matchs.'}
        </p>
      </header>

      <EditeurAvatar avatar={session.avatar ?? undefined} tenue={tenue} />

      {/* ------------------------------------------------------- Vestiaire */}
      {session.avatar && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-display text-2xl font-bold">
              <Shirt className="h-6 w-6 text-cyan" aria-hidden />
              Vestiaire
            </h2>
            <LienBouton href="/boutique" variante="contour" taille="sm">
              <Sparkles className="h-4 w-4" aria-hidden />
              Aller à la boutique
            </LienBouton>
          </div>

          {inventaire.length === 0 ? (
            <Carte className="p-6 text-sm text-muted-foreground">
              Votre inventaire est vide. Les cosmétiques s’achètent en boutique avec vos jetons.
            </Carte>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {EMPLACEMENTS.map(({ cle, label }) => {
                const articles = inventaire.filter((c) => c.categorie === cle)
                const equipe = tenue[cle]

                return (
                  <Carte key={cle} className="space-y-3 p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-display font-semibold">{label}</p>
                      {equipe && <Badge ton="cyan">Équipé</Badge>}
                    </div>

                    {articles.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Rien dans cette catégorie.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {articles.map((article) => {
                          const actif = equipe?.id === article.id
                          return (
                            <li key={article.id}>
                              <form action={equiperCosmetique}>
                                <input type="hidden" name="avatar_id" value={session.avatar!.id} />
                                <input type="hidden" name="categorie" value={cle} />
                                {/* Cliquer sur l'objet équipé le retire. */}
                                <input
                                  type="hidden"
                                  name="cosmetique_id"
                                  value={actif ? '' : article.id}
                                />
                                <Bouton
                                  type="submit"
                                  variante={actif ? 'cyan' : 'fantome'}
                                  taille="sm"
                                  className={cn('w-full justify-start', !actif && 'hover:bg-muted')}
                                >
                                  <span
                                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                                    style={{ background: COULEUR_RARETE[article.rarete] }}
                                    aria-hidden
                                  />
                                  <span className="truncate">{article.nom}</span>
                                  {actif && <span className="ml-auto text-xs">retirer</span>}
                                </Bouton>
                              </form>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </Carte>
                )
              })}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
