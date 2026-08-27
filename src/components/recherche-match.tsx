'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { Bot, Loader2, Search, X } from 'lucide-react'
import { annulerRecherche, lancerRecherche } from '@/lib/actions/matchmaking'
import { Alerte, Badge, Bouton, Carte } from '@/components/ui'
import { cn, LIBELLE_FORMAT } from '@/lib/utils'
import type { EtatAction, Sport } from '@/lib/types'

/** Toutes les 4 secondes sans adversaire, on relance en élargissant la fenêtre d'elo. */
const PERIODE_RELANCE = 4

export function RechercheMatch({
  sports,
  elo,
  rechercheEnCours,
}: {
  sports: Sport[]
  elo: number
  /** Le joueur était déjà dans la file en arrivant sur la page. */
  rechercheEnCours: boolean
}) {
  const [etat, action] = useActionState<EtatAction, FormData>(lancerRecherche, null)
  const formRef = useRef<HTMLFormElement>(null)

  const [sportId, setSportId] = useState(sports[0]?.id ?? '')
  const [format, setFormat] = useState<number>(1)
  const [avecBots, setAvecBots] = useState(true)
  const [enRecherche, setEnRecherche] = useState(rechercheEnCours)
  const [attente, setAttente] = useState(0)

  const sport = sports.find((s) => s.id === sportId)
  const formatsPossibles = sport?.formats ?? [1, 2, 4]

  // Si la discipline choisie n'accepte pas le format courant, on retombe sur le premier valide.
  useEffect(() => {
    if (sport && !sport.formats.includes(format)) {
      setFormat(sport.formats[0] ?? 1)
    }
  }, [sport, format])

  // Chronomètre de la recherche
  useEffect(() => {
    if (!enRecherche) return
    const timer = setInterval(() => setAttente((v) => v + 1), 1000)
    return () => clearInterval(timer)
  }, [enRecherche])

  // Relance périodique : la tolérance d'elo envoyée au serveur grandit avec l'attente.
  useEffect(() => {
    if (!enRecherche || attente === 0) return
    if (attente % PERIODE_RELANCE !== 0) return
    formRef.current?.requestSubmit()
  }, [attente, enRecherche])

  async function arreter() {
    setEnRecherche(false)
    setAttente(0)
    await annulerRecherche()
  }

  return (
    <div className="space-y-6">
      <form
        ref={formRef}
        action={action}
        onSubmit={() => setEnRecherche(true)}
        className="space-y-6"
      >
        <input type="hidden" name="sport_id" value={sportId} />
        <input type="hidden" name="format" value={format} />
        <input type="hidden" name="attente" value={attente} />
        {avecBots && <input type="hidden" name="bots" value="1" />}

        {etat && !etat.ok && <Alerte ton="danger">{etat.message}</Alerte>}

        {/* ------------------------------------------------------ Discipline */}
        <Carte className="space-y-3 p-5">
          <h2 className="font-display text-lg font-semibold">1. Choisissez la discipline</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {sports.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSportId(s.id)}
                aria-pressed={sportId === s.id}
                disabled={enRecherche}
                className={cn(
                  'flex items-start gap-3 rounded-lg border p-3 text-left transition-colors disabled:opacity-60',
                  sportId === s.id
                    ? 'border-neon bg-neon/10'
                    : 'border-border bg-card hover:bg-muted',
                )}
              >
                <span className="text-2xl leading-none" aria-hidden>
                  {s.icone}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{s.nom}</span>
                  <span className="block text-xs text-muted-foreground">
                    {s.formats.map((f) => `${f}v${f}`).join(' · ')}
                  </span>
                </span>
              </button>
            ))}
          </div>
          {sport?.description && (
            <p className="text-sm text-muted-foreground">{sport.description}</p>
          )}
        </Carte>

        {/* ---------------------------------------------------------- Format */}
        <Carte className="space-y-3 p-5">
          <h2 className="font-display text-lg font-semibold">2. Choisissez le format</h2>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 4].map((f) => {
              const disponible = formatsPossibles.includes(f)
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormat(f)}
                  disabled={!disponible || enRecherche}
                  aria-pressed={format === f}
                  className={cn(
                    'rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors',
                    format === f
                      ? 'border-neon bg-neon text-neon-foreground'
                      : 'border-border bg-card hover:bg-muted',
                    !disponible && 'cursor-not-allowed opacity-40',
                  )}
                >
                  {LIBELLE_FORMAT[f]}
                </button>
              )
            })}
          </div>
          {!formatsPossibles.includes(1) && (
            <p className="text-xs text-muted-foreground">
              Cette discipline ne se joue pas en solo.
            </p>
          )}
        </Carte>

        {/* -------------------------------------------------------- Lancement */}
        <Carte className="space-y-4 p-5">
          <h2 className="font-display text-lg font-semibold">3. Lancez la recherche</h2>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3">
            <input
              type="checkbox"
              checked={avecBots}
              onChange={(e) => setAvecBots(e.target.checked)}
              disabled={enRecherche}
              className="mt-0.5 h-4 w-4 rounded border-input"
            />
            <span className="text-sm">
              <span className="flex items-center gap-1.5 font-medium">
                <Bot className="h-4 w-4 text-cyan" aria-hidden />
                Accepter des adversaires gérés par la machine
              </span>
              <span className="text-muted-foreground">
                Recommandé : ils sont choisis à votre niveau d’elo et permettent de jouer tout de
                suite. Sans eux, il faut qu’un autre joueur cherche le même format au même moment.
              </span>
            </span>
          </label>

          <div className="flex flex-wrap items-center gap-3">
            {!enRecherche ? (
              <Bouton type="submit" taille="lg" disabled={!sportId}>
                <Search className="h-5 w-5" aria-hidden />
                Chercher un adversaire
              </Bouton>
            ) : (
              <Bouton type="button" variante="contour" taille="lg" onClick={arreter}>
                <X className="h-5 w-5" aria-hidden />
                Annuler la recherche
              </Bouton>
            )}

            <Badge ton="neutre">Votre elo : {elo}</Badge>
          </div>
        </Carte>
      </form>

      {/* ------------------------------------------------------- En attente */}
      {enRecherche && (
        <Carte className="overflow-hidden">
          <div className="barre-recherche h-1 animate-balayage" aria-hidden />
          <div className="flex flex-col items-center gap-3 p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-neon" aria-hidden />
            <p className="font-display text-lg font-semibold">Recherche en cours…</p>
            <p className="max-w-md text-sm text-muted-foreground">
              On cherche un adversaire dont le niveau est proche du vôtre. Plus l’attente dure,
              plus la fenêtre d’elo s’élargit.
            </p>
            <p className="font-display text-2xl font-bold tabular-nums text-muted-foreground">
              {String(Math.floor(attente / 60)).padStart(2, '0')}:
              {String(attente % 60).padStart(2, '0')}
            </p>
          </div>
        </Carte>
      )}
    </div>
  )
}
