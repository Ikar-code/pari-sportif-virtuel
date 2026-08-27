'use client'

import { useActionState, useState } from 'react'
import { Check, Coins, Lock } from 'lucide-react'
import { acheterCosmetique } from '@/lib/actions/boutique'
import { Bonhomme, type ApparenceBonhomme } from '@/components/bonhomme'
import { Alerte, Badge, Carte } from '@/components/ui'
import { BoutonEnvoi } from '@/components/bouton-envoi'
import { cn, COULEUR_RARETE, formatJetons, LIBELLE_RARETE } from '@/lib/utils'
import type { CategorieCosmetique, Cosmetique, EtatAction, Tenue } from '@/lib/types'

const CATEGORIES: { cle: CategorieCosmetique | 'tout'; label: string }[] = [
  { cle: 'tout', label: 'Tout' },
  { cle: 'chapeau', label: 'Chapeaux' },
  { cle: 'visage', label: 'Visages' },
  { cle: 'accessoire', label: 'Accessoires' },
  { cle: 'cape', label: 'Capes' },
  { cle: 'aura', label: 'Auras' },
]

export function BoutiqueGrille({
  cosmetiques,
  possedes,
  solde,
  apparence,
  tenue,
}: {
  cosmetiques: Cosmetique[]
  possedes: string[]
  solde: number
  /** Apparence du joueur, pour un aperçu à ses couleurs. */
  apparence: ApparenceBonhomme
  tenue: Tenue
}) {
  const [etat, action] = useActionState<EtatAction, FormData>(acheterCosmetique, null)
  const [categorie, setCategorie] = useState<CategorieCosmetique | 'tout'>('tout')

  const visibles =
    categorie === 'tout' ? cosmetiques : cosmetiques.filter((c) => c.categorie === categorie)

  return (
    <div className="space-y-5">
      {etat && <Alerte ton={etat.ok ? 'succes' : 'danger'}>{etat.message}</Alerte>}

      <nav className="flex flex-wrap gap-2" aria-label="Filtrer par catégorie">
        {CATEGORIES.map((c) => (
          <button
            key={c.cle}
            type="button"
            onClick={() => setCategorie(c.cle)}
            aria-pressed={categorie === c.cle}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
              categorie === c.cle
                ? 'border-neon bg-neon text-neon-foreground'
                : 'border-border bg-card hover:bg-muted',
            )}
          >
            {c.label}
          </button>
        ))}
      </nav>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visibles.map((article) => {
          const possede = possedes.includes(article.id)
          const abordable = solde >= Number(article.prix)

          // Aperçu : l'article seul, posé sur le bonhomme du joueur.
          const apercu: Tenue = { ...tenue, [article.categorie]: article }

          return (
            <Carte
              key={article.id}
              className="flex flex-col overflow-hidden"
              style={{ borderColor: possede ? COULEUR_RARETE[article.rarete] : undefined }}
            >
              <div
                className="flex justify-center py-3"
                style={{ background: `${COULEUR_RARETE[article.rarete]}14` }}
              >
                <Bonhomme apparence={apparence} tenue={apercu} taille={104} />
              </div>

              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-display font-semibold leading-tight">{article.nom}</p>
                  <Badge
                    ton="neutre"
                    className="shrink-0"
                    style={{
                      background: `${COULEUR_RARETE[article.rarete]}22`,
                      color: COULEUR_RARETE[article.rarete],
                    }}
                  >
                    {LIBELLE_RARETE[article.rarete]}
                  </Badge>
                </div>

                {article.description && (
                  <p className="text-sm text-muted-foreground">{article.description}</p>
                )}

                <div className="mt-auto pt-2">
                  {possede ? (
                    <p className="flex items-center justify-center gap-1.5 rounded-lg bg-succes/10 py-2 text-sm font-medium text-succes">
                      <Check className="h-4 w-4" aria-hidden />
                      Dans votre inventaire
                    </p>
                  ) : (
                    <form action={action}>
                      <input type="hidden" name="cosmetique_id" value={article.id} />
                      <BoutonEnvoi
                        variante={abordable ? 'jeton' : 'contour'}
                        className="w-full"
                        enCours="Achat…"
                        disabled={!abordable}
                      >
                        {abordable ? (
                          <Coins className="h-4 w-4" aria-hidden />
                        ) : (
                          <Lock className="h-4 w-4" aria-hidden />
                        )}
                        {formatJetons(Number(article.prix))}
                      </BoutonEnvoi>
                    </form>
                  )}
                </div>
              </div>
            </Carte>
          )
        })}
      </div>
    </div>
  )
}
