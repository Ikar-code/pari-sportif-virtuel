import Link from 'next/link'
import { Coins, Users } from 'lucide-react'
import { Badge, Carte } from '@/components/ui'
import { Vignette } from '@/components/bonhomme'
import { StatutMatchBadge } from '@/components/statut-badge'
import { CompteARebours } from '@/components/compte-a-rebours'
import { cn, formatCote, formatDateHeure, formatJetons, LIBELLE_FORMAT } from '@/lib/utils'
import type { MatchDetaille, Participant } from '@/lib/types'

function Camp({
  nom,
  participants,
  score,
  cote,
  couleur,
  gagnant,
  aligneADroite,
}: {
  nom: string
  participants: Participant[]
  score: number | null
  cote: number
  couleur: string
  gagnant: boolean | null
  aligneADroite?: boolean
}) {
  return (
    <div className={cn('flex min-w-0 flex-1 flex-col gap-2', aligneADroite && 'items-end')}>
      <div className={cn('flex items-center gap-1.5', aligneADroite && 'flex-row-reverse')}>
        {participants.slice(0, 4).map((p) => (
          <Vignette
            key={p.avatar_id}
            apparence={p}
            taille={32}
            className={gagnant === false ? 'opacity-50' : undefined}
          />
        ))}
        {participants.length === 0 && (
          <span className="h-8 w-8 rounded-full bg-muted" aria-hidden />
        )}
      </div>

      <p
        className={cn(
          'w-full truncate text-sm font-medium',
          aligneADroite && 'text-right',
          gagnant === false && 'text-muted-foreground',
        )}
      >
        {participants.length === 1 ? participants[0].avatar_nom : nom}
      </p>

      {score !== null ? (
        <p
          className="font-display text-2xl font-bold tabular-nums"
          style={{ color: gagnant ? couleur : undefined }}
        >
          {score}
        </p>
      ) : (
        <span
          className="rounded-md px-2 py-0.5 text-sm font-semibold tabular-nums"
          style={{ background: `${couleur}1f`, color: couleur }}
        >
          {formatCote(cote)}
        </span>
      )}
    </div>
  )
}

export function CarteMatch({
  match,
  participants = [],
}: {
  match: MatchDetaille
  participants?: Participant[]
}) {
  const campA = participants.filter((p) => p.camp === 'A')
  const campB = participants.filter((p) => p.camp === 'B')

  const termine = match.statut_effectif === 'termine'
  const gagnantA = termine && match.score_a !== null && match.score_b !== null
    ? match.score_a > match.score_b
    : null

  return (
    <Carte className="group relative flex flex-col overflow-hidden transition-shadow hover:shadow-carte-hover">
      <span
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-campA to-campB"
        aria-hidden
      />

      <div className="flex flex-1 flex-col gap-4 p-5 pt-6">
        <div className="flex items-start justify-between gap-2">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="text-xl leading-none" aria-hidden>
              {match.sport_icone}
            </span>
            <span className="truncate">{match.sport_nom}</span>
          </span>
          <StatutMatchBadge statut={match.statut_effectif} />
        </div>

        <div className="flex items-center gap-3">
          <Camp
            nom="Camp A"
            participants={campA}
            score={termine ? match.score_a : null}
            cote={match.cote_a}
            couleur="hsl(var(--camp-a))"
            gagnant={gagnantA}
          />

          <span className="shrink-0 font-display text-xs font-bold uppercase text-muted-foreground">
            vs
          </span>

          <Camp
            nom="Camp B"
            participants={campB}
            score={termine ? match.score_b : null}
            cote={match.cote_b}
            couleur="hsl(var(--camp-b))"
            gagnant={gagnantA === null ? null : !gagnantA}
            aligneADroite
          />
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
          <Badge ton="neutre">{LIBELLE_FORMAT[match.format]}</Badge>

          {match.statut_effectif === 'a_venir' ? (
            <span className="font-medium text-succes">
              Coup d’envoi dans <CompteARebours date={match.date_coup_envoi} />
            </span>
          ) : (
            <span>{formatDateHeure(match.date_coup_envoi)}</span>
          )}

          {match.nb_paris > 0 && (
            <>
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" aria-hidden />
                {match.nb_paris}
              </span>
              <span className="inline-flex items-center gap-1 text-jeton">
                <Coins className="h-3.5 w-3.5" aria-hidden />
                {formatJetons(Number(match.total_mise))}
              </span>
            </>
          )}
        </div>
      </div>

      <Link href={`/matchs/${match.id}`} className="absolute inset-0" aria-label={`Voir le match ${match.sport_nom}`}>
        <span className="sr-only">Voir le match</span>
      </Link>
    </Carte>
  )
}
