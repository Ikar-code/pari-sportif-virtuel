'use client'

import { useActionState, useMemo, useState } from 'react'
import { Minus, Plus, Shuffle } from 'lucide-react'
import { creerAvatar, modifierAvatar } from '@/lib/actions/avatar'
import { Bonhomme } from '@/components/bonhomme'
import { Alerte, Bouton, Carte, ChampFormulaire, Input, Jauge } from '@/components/ui'
import { BoutonEnvoi } from '@/components/bouton-envoi'
import {
  budgetStats,
  cn,
  LIBELLE_STAT,
  STAT_MAX,
  STAT_MIN,
} from '@/lib/utils'
import { CLES_STATS, type Avatar, type CleStat, type EtatAction, type Stats, type Tenue } from '@/lib/types'

const PALETTE_CORPS = ['#7C5CFF', '#22D3EE', '#F97316', '#10B981', '#EF4444', '#EC4899', '#FACC15', '#38BDF8']
const PALETTE_TEINT = ['#FFE0BD', '#FFD9A0', '#F1C27D', '#C68642', '#8D5524', '#5C3A21']

const STATS_PAR_DEFAUT: Stats = {
  vitesse: 10,
  puissance: 10,
  technique: 10,
  endurance: 10,
  mental: 10,
}

function ChoixCouleur({
  label,
  valeur,
  palette,
  onChange,
  name,
}: {
  label: string
  valeur: string
  palette: string[]
  onChange: (v: string) => void
  name: string
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <input type="hidden" name={name} value={valeur} />
      <div className="flex flex-wrap items-center gap-2">
        {palette.map((couleur) => (
          <button
            key={couleur}
            type="button"
            onClick={() => onChange(couleur)}
            aria-label={`${label} : ${couleur}`}
            aria-pressed={valeur === couleur}
            className={cn(
              'h-7 w-7 rounded-full border-2 transition-transform hover:scale-110',
              valeur === couleur ? 'border-foreground' : 'border-transparent',
            )}
            style={{ background: couleur }}
          />
        ))}
        <label className="ml-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <input
            type="color"
            value={valeur}
            onChange={(e) => onChange(e.target.value)}
            className="h-7 w-9 cursor-pointer rounded border border-border bg-transparent p-0.5"
            aria-label={`${label} personnalisée`}
          />
          libre
        </label>
      </div>
    </div>
  )
}

export function EditeurAvatar({
  avatar,
  tenue,
}: {
  /** Absent en mode création. */
  avatar?: Avatar
  tenue?: Tenue
}) {
  const edition = Boolean(avatar)
  const [etat, action] = useActionState<EtatAction, FormData>(
    edition ? modifierAvatar : creerAvatar,
    null,
  )

  const [nom, setNom] = useState(avatar?.nom ?? '')
  const [corps, setCorps] = useState(avatar?.couleur_corps ?? PALETTE_CORPS[0])
  const [teint, setTeint] = useState(avatar?.couleur_tete ?? PALETTE_TEINT[1])
  const [accent, setAccent] = useState(avatar?.couleur_accent ?? PALETTE_CORPS[1])

  const [stats, setStats] = useState<Stats>(() =>
    avatar
      ? {
          vitesse: avatar.vitesse,
          puissance: avatar.puissance,
          technique: avatar.technique,
          endurance: avatar.endurance,
          mental: avatar.mental,
        }
      : { ...STATS_PAR_DEFAUT },
  )

  const budget = budgetStats(avatar?.niveau ?? 1)
  const depenses = useMemo(() => CLES_STATS.reduce((s, c) => s + stats[c], 0), [stats])
  const restants = budget - depenses

  function ajuster(cle: CleStat, delta: number) {
    setStats((prec) => {
      const cible = prec[cle] + delta
      if (cible < STAT_MIN || cible > STAT_MAX) return prec
      if (delta > 0 && restants <= 0) return prec
      return { ...prec, [cle]: cible }
    })
  }

  /** Répartit le budget au hasard, en respectant les bornes. */
  function auHasard() {
    const base: Stats = { vitesse: 1, puissance: 1, technique: 1, endurance: 1, mental: 1 }
    let reste = budget - 5

    while (reste > 0) {
      const cle = CLES_STATS[Math.floor(Math.random() * CLES_STATS.length)]
      if (base[cle] >= STAT_MAX) continue
      base[cle] += 1
      reste -= 1
    }
    setStats(base)
  }

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[320px_1fr] lg:items-start">
      {/* --------------------------------------------------------- Aperçu */}
      <Carte className="sticky top-20 flex flex-col items-center gap-3 p-6">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Aperçu</p>
        <div className="grille-arene rounded-lg px-4 py-2">
          <Bonhomme
            apparence={{ couleur_corps: corps, couleur_tete: teint, couleur_accent: accent }}
            tenue={tenue}
            taille={170}
            anime
          />
        </div>
        <p className="font-display text-lg font-bold">{nom || 'Sans nom'}</p>
        {avatar && (
          <p className="text-sm text-muted-foreground">
            Niveau {avatar.niveau} · {avatar.elo} elo
          </p>
        )}
      </Carte>

      {/* ------------------------------------------------------ Réglages */}
      <div className="space-y-6">
        {etat && <Alerte ton={etat.ok ? 'succes' : 'danger'}>{etat.message}</Alerte>}

        <Carte className="space-y-5 p-6">
          <ChampFormulaire label="Nom du bonhomme" htmlFor="nom" obligatoire>
            <Input
              id="nom"
              name="nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
              maxLength={24}
              placeholder="Bâton Fou"
            />
          </ChampFormulaire>

          <div className="grid gap-5 sm:grid-cols-3">
            <ChoixCouleur
              label="Corps"
              name="couleur_corps"
              valeur={corps}
              palette={PALETTE_CORPS}
              onChange={setCorps}
            />
            <ChoixCouleur
              label="Teint"
              name="couleur_tete"
              valeur={teint}
              palette={PALETTE_TEINT}
              onChange={setTeint}
            />
            <ChoixCouleur
              label="Accent"
              name="couleur_accent"
              valeur={accent}
              palette={PALETTE_CORPS}
              onChange={setAccent}
            />
          </div>
        </Carte>

        {/* ------------------------------------------------ Statistiques */}
        <Carte className="space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold">Statistiques</h2>
              <p className="text-sm text-muted-foreground">
                Elles décident du résultat des matchs — chaque discipline pondère les cinq
                différemment.
              </p>
            </div>
            <Bouton type="button" variante="contour" taille="sm" onClick={auHasard}>
              <Shuffle className="h-4 w-4" aria-hidden />
              Au hasard
            </Bouton>
          </div>

          <div
            className={cn(
              'flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm font-medium',
              restants === 0
                ? 'border-succes/30 bg-succes/10 text-succes'
                : restants > 0
                  ? 'border-jeton/30 bg-jeton/10 text-jeton'
                  : 'border-danger/30 bg-danger/10 text-danger',
            )}
          >
            <span>Points à répartir</span>
            <span className="font-display text-lg tabular-nums">
              {restants} / {budget}
            </span>
          </div>

          <div className="space-y-3">
            {CLES_STATS.map((cle) => (
              <div key={cle} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{LIBELLE_STAT[cle]}</span>
                  <span className="font-display text-base font-bold tabular-nums">
                    {stats[cle]}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Bouton
                    type="button"
                    variante="contour"
                    taille="icone"
                    onClick={() => ajuster(cle, -1)}
                    disabled={stats[cle] <= STAT_MIN}
                    aria-label={`Retirer un point en ${LIBELLE_STAT[cle]}`}
                  >
                    <Minus className="h-4 w-4" aria-hidden />
                  </Bouton>

                  <Jauge valeur={stats[cle]} couleur={corps} className="flex-1" />

                  <Bouton
                    type="button"
                    variante="contour"
                    taille="icone"
                    onClick={() => ajuster(cle, 1)}
                    disabled={stats[cle] >= STAT_MAX || restants <= 0}
                    aria-label={`Ajouter un point en ${LIBELLE_STAT[cle]}`}
                  >
                    <Plus className="h-4 w-4" aria-hidden />
                  </Bouton>
                </div>

                <input type="hidden" name={cle} value={stats[cle]} />
              </div>
            ))}
          </div>

          <BoutonEnvoi
            taille="lg"
            enCours="Enregistrement…"
            disabled={restants < 0 || (!edition && restants !== 0)}
          >
            {edition ? 'Enregistrer' : 'Créer mon bonhomme'}
          </BoutonEnvoi>

          {!edition && restants !== 0 && (
            <p className="text-xs text-muted-foreground">
              Placez vos {budget} points pour continuer.
            </p>
          )}
        </Carte>
      </div>
    </form>
  )
}
