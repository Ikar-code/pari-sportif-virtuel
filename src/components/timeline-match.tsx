import { Flag, Sparkles, Target, Trophy } from 'lucide-react'
import { reglagesSport } from '@/lib/simulation/commentaires'
import { cn } from '@/lib/utils'
import type { EvenementMatch } from '@/lib/types'

/**
 * Déroulé du match tel que le moteur l'a produit.
 * Les points sont mis en avant, le reste sert d'habillage.
 */
export function TimelineMatch({
  evenements,
  sportSlug,
  nomA,
  nomB,
}: {
  evenements: EvenementMatch[]
  sportSlug: string | null
  nomA: string
  nomB: string
}) {
  const reglages = reglagesSport(sportSlug)

  let scoreA = 0
  let scoreB = 0

  return (
    <ol className="relative space-y-1 pl-6">
      {/* Le fil vertical */}
      <span className="fil-parcours absolute left-2 top-2 h-[calc(100%-1rem)] w-0.5" aria-hidden />

      {evenements.map((e) => {
        if (e.type === 'point') {
          if (e.camp === 'A') scoreA++
          else if (e.camp === 'B') scoreB++
        }

        const estPoint = e.type === 'point'
        const couleurCamp =
          e.camp === 'A' ? 'hsl(var(--camp-a))' : e.camp === 'B' ? 'hsl(var(--camp-b))' : undefined

        return (
          <li key={e.id} className="relative py-1.5">
            <span
              className={cn(
                'absolute -left-6 top-2 grid h-4 w-4 place-items-center rounded-full border-2 border-background',
                estPoint ? 'h-5 w-5 -left-[1.65rem]' : '',
              )}
              style={{ background: couleurCamp ?? 'hsl(var(--muted-foreground))' }}
              aria-hidden
            >
              {estPoint && <Target className="h-2.5 w-2.5 text-white" />}
            </span>

            <div
              className={cn(
                'flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-lg px-2 py-1',
                estPoint && 'bg-muted/70',
              )}
            >
              <span className="w-16 shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                {e.type === 'coup_envoi' ? (
                  <Flag className="h-3.5 w-3.5" aria-label="Coup d’envoi" />
                ) : e.type === 'fin' ? (
                  <Trophy className="h-3.5 w-3.5" aria-label="Fin du match" />
                ) : (
                  reglages.libelleTemps(e.minute)
                )}
              </span>

              <span className={cn('flex-1 text-sm', estPoint ? 'font-medium' : 'text-muted-foreground')}>
                {e.texte}
              </span>

              {estPoint && (
                <span className="shrink-0 font-display text-sm font-bold tabular-nums">
                  {scoreA} — {scoreB}
                </span>
              )}
            </div>
          </li>
        )
      })}

      {evenements.length === 0 && (
        <li className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4" aria-hidden />
          Le match n’a pas encore été joué. Le déroulé apparaîtra ici dès le coup d’envoi
          ({nomA} contre {nomB}).
        </li>
      )}
    </ol>
  )
}
