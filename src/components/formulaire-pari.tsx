'use client'

import { useActionState, useState } from 'react'
import { Coins } from 'lucide-react'
import { parier } from '@/lib/actions/paris'
import { Alerte, Bouton, Input } from '@/components/ui'
import { BoutonEnvoi } from '@/components/bouton-envoi'
import { cn, formatCote, formatJetons } from '@/lib/utils'
import type { Camp, EtatAction } from '@/lib/types'

const MISES_RAPIDES = [50, 100, 250, 500]
const MISE_MINIMALE = 10

export function FormulairePari({
  matchId,
  coteA,
  coteB,
  nomA,
  nomB,
  solde,
}: {
  matchId: string
  coteA: number
  coteB: number
  nomA: string
  nomB: string
  solde: number
}) {
  const [etat, action] = useActionState<EtatAction, FormData>(parier, null)
  const [camp, setCamp] = useState<Camp | null>(null)
  const [mise, setMise] = useState<number>(100)

  const cote = camp === 'A' ? coteA : camp === 'B' ? coteB : 0
  const gainPotentiel = camp ? mise * cote : 0
  const miseValide = mise >= MISE_MINIMALE && mise <= solde

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="match_id" value={matchId} />
      <input type="hidden" name="camp" value={camp ?? ''} />
      <input type="hidden" name="mise" value={mise} />

      {etat && <Alerte ton={etat.ok ? 'succes' : 'danger'}>{etat.message}</Alerte>}

      {/* ------------------------------------------------------- Le camp */}
      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium">Sur qui misez-vous ?</legend>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { valeur: 'A' as Camp, nom: nomA, cote: coteA, couleur: 'hsl(var(--camp-a))' },
              { valeur: 'B' as Camp, nom: nomB, cote: coteB, couleur: 'hsl(var(--camp-b))' },
            ]
          ).map((option) => (
            <button
              key={option.valeur}
              type="button"
              onClick={() => setCamp(option.valeur)}
              aria-pressed={camp === option.valeur}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg border-2 p-3 transition-colors',
                camp === option.valeur ? 'bg-muted' : 'border-border hover:bg-muted',
              )}
              style={camp === option.valeur ? { borderColor: option.couleur } : undefined}
            >
              <span className="w-full truncate text-sm font-medium">{option.nom}</span>
              <span
                className="font-display text-xl font-bold tabular-nums"
                style={{ color: option.couleur }}
              >
                {formatCote(option.cote)}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      {/* ------------------------------------------------------- La mise */}
      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium">Combien ?</legend>

        <div className="flex flex-wrap gap-2">
          {MISES_RAPIDES.map((montant) => (
            <Bouton
              key={montant}
              type="button"
              variante={mise === montant ? 'jeton' : 'contour'}
              taille="sm"
              onClick={() => setMise(montant)}
              disabled={montant > solde}
            >
              {montant}
            </Bouton>
          ))}
          <Bouton
            type="button"
            variante="contour"
            taille="sm"
            onClick={() => setMise(Math.floor(solde))}
            disabled={solde < MISE_MINIMALE}
          >
            Tout
          </Bouton>
        </div>

        <div className="relative">
          <Coins
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-jeton"
            aria-hidden
          />
          <Input
            type="number"
            min={MISE_MINIMALE}
            max={Math.floor(solde)}
            step={10}
            value={mise}
            onChange={(e) => setMise(Number(e.target.value))}
            aria-label="Montant de la mise"
            className="pl-9"
          />
        </div>

        <p className="text-xs text-muted-foreground">
          Mise minimale {MISE_MINIMALE} jetons · solde disponible {formatJetons(solde)}
        </p>
      </fieldset>

      {/* --------------------------------------------------- Gain estimé */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-4 py-3">
        <span className="text-sm text-muted-foreground">Gain si vous gagnez</span>
        <span className="font-display text-xl font-bold tabular-nums text-jeton">
          {camp ? formatJetons(Math.round(gainPotentiel)) : '—'}
        </span>
      </div>

      <BoutonEnvoi
        variante="jeton"
        taille="lg"
        className="w-full"
        enCours="Enregistrement…"
        disabled={!camp || !miseValide}
      >
        Placer le pari
      </BoutonEnvoi>

      {!miseValide && mise > solde && (
        <p className="text-xs text-danger">Votre solde ne couvre pas cette mise.</p>
      )}
    </form>
  )
}
