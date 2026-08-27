import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Award, Coins, Dices, Swords } from 'lucide-react'
import {
  getEvenements,
  getMatch,
  getMonPari,
  getParticipants,
  getSession,
  getTenues,
} from '@/lib/queries'
import { assurerMatchSimule } from '@/lib/simulation/executer'
import { probabiliteDepuisCote } from '@/lib/simulation/cotes'
import { Bonhomme, Vignette } from '@/components/bonhomme'
import { FormulairePari } from '@/components/formulaire-pari'
import { TimelineMatch } from '@/components/timeline-match'
import { StatutMatchBadge, StatutPariBadge } from '@/components/statut-badge'
import { CompteARebours } from '@/components/compte-a-rebours'
import { Alerte, Badge, Carte, LienBouton, Separateur } from '@/components/ui'
import {
  cn,
  formatCote,
  formatDateHeure,
  formatJetons,
  formatPourcent,
  LIBELLE_FORMAT,
} from '@/lib/utils'
import type { Participant, Tenue } from '@/lib/types'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params
  const match = await getMatch(id)
  if (!match) return { title: 'Match introuvable' }
  return { title: `${match.sport_nom} — ${LIBELLE_FORMAT[match.format]}` }
}

/** Colonne d'un camp : les bonshommes, le nom, le score. */
function ColonneCamp({
  participants,
  tenues,
  couleur,
  score,
  gagnant,
  miroir,
}: {
  participants: Participant[]
  tenues: Record<string, Tenue>
  couleur: string
  score: number | null
  gagnant: boolean | null
  miroir?: boolean
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-3">
      <div className={cn('flex flex-wrap items-end justify-center gap-1', gagnant === false && 'opacity-60')}>
        {participants.map((p) => (
          <div key={p.avatar_id} className="flex flex-col items-center">
            <Bonhomme
              apparence={p}
              tenue={tenues[p.avatar_id]}
              taille={participants.length > 2 ? 78 : 108}
              regardeAGauche={miroir}
            />
            <span className="max-w-[7rem] truncate text-xs font-medium">{p.avatar_nom}</span>
            <span className="text-[0.7rem] text-muted-foreground">
              {p.est_bot ? 'machine' : (p.proprietaire_pseudo ?? 'joueur')} · {p.elo}
            </span>
          </div>
        ))}
      </div>

      {score !== null && (
        <span
          className="font-display text-5xl font-bold tabular-nums"
          style={{ color: gagnant ? couleur : undefined }}
        >
          {score}
        </span>
      )}
    </div>
  )
}

export default async function PageMatch({ params }: Params) {
  const { id } = await params

  // Si l'heure du coup d'envoi est passée, le match se joue maintenant.
  await assurerMatchSimule(id)

  const match = await getMatch(id)
  if (!match) notFound()

  const session = await getSession()
  const [participants, evenements, monPari] = await Promise.all([
    getParticipants(match.id),
    getEvenements(match.id),
    session ? getMonPari(match.id, session.profil.id) : Promise.resolve(null),
  ])

  const tenues = await getTenues(participants.map((p) => p.avatar_id))

  const campA = participants.filter((p) => p.camp === 'A')
  const campB = participants.filter((p) => p.camp === 'B')

  const termine = match.statut_effectif === 'termine'
  const parisOuverts = match.statut_effectif === 'a_venir'

  const gagnantA =
    termine && match.score_a !== null && match.score_b !== null
      ? match.score_a > match.score_b
      : null
  const nul = termine && match.score_a === match.score_b

  const nomA = campA.length === 1 ? campA[0].avatar_nom : 'Camp A'
  const nomB = campB.length === 1 ? campB[0].avatar_nom : 'Camp B'

  const mvp = participants.find((p) => p.avatar_id === match.mvp_avatar_id)

  const probaA = probabiliteDepuisCote(match.cote_a)
  const probaB = probabiliteDepuisCote(match.cote_b)
  const totalProba = probaA + probaB

  return (
    <div className="pb-16">
      {/* ------------------------------------------------------------ Arène */}
      <header className="border-b border-border bg-gradient-to-b from-neon/10 to-transparent">
        <div className="container space-y-6 py-8">
          <nav className="text-sm text-muted-foreground">
            <Link href="/matchs" className="hover:text-foreground">
              Matchs
            </Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{match.sport_nom}</span>
          </nav>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Badge ton="neon">
              <span aria-hidden>{match.sport_icone}</span>
              {match.sport_nom}
            </Badge>
            <Badge ton="neutre">{LIBELLE_FORMAT[match.format]}</Badge>
            <StatutMatchBadge statut={match.statut_effectif} />
          </div>

          <div className="grille-arene rounded-lg py-4">
            <div className="flex items-center justify-center gap-4 sm:gap-10">
              <ColonneCamp
                participants={campA}
                tenues={tenues}
                couleur="hsl(var(--camp-a))"
                score={termine ? match.score_a : null}
                gagnant={nul ? null : gagnantA}
              />

              <div className="shrink-0 text-center">
                {parisOuverts ? (
                  <>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Coup d’envoi
                    </p>
                    <CompteARebours
                      date={match.date_coup_envoi}
                      className="font-display text-3xl font-bold text-neon"
                    />
                  </>
                ) : (
                  <Swords className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden />
                )}
              </div>

              <ColonneCamp
                participants={campB}
                tenues={tenues}
                couleur="hsl(var(--camp-b))"
                score={termine ? match.score_b : null}
                gagnant={nul ? null : gagnantA === null ? null : !gagnantA}
                miroir
              />
            </div>
          </div>

          {termine && (
            <p className="text-center font-display text-lg font-semibold">
              {nul
                ? 'Match nul — les mises sont remboursées.'
                : `Victoire du ${gagnantA ? nomA : nomB} !`}
            </p>
          )}
        </div>
      </header>

      <div className="container grid gap-8 py-8 lg:grid-cols-[1fr_340px] lg:items-start">
        {/* --------------------------------------------------- Colonne gauche */}
        <div className="space-y-8">
          {/* Probabilités */}
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold">
              <Dices className="h-5 w-5 text-neon" aria-hidden />
              Les forces en présence
            </h2>

            <Carte className="space-y-3 p-5">
              <div className="flex items-center justify-between text-sm font-medium">
                <span style={{ color: 'hsl(var(--camp-a))' }}>
                  {nomA} · {formatPourcent(probaA / totalProba)}
                </span>
                <span style={{ color: 'hsl(var(--camp-b))' }}>
                  {formatPourcent(probaB / totalProba)} · {nomB}
                </span>
              </div>

              <div className="flex h-3 overflow-hidden rounded-full bg-muted">
                <div
                  className="bg-campA"
                  style={{ width: `${(probaA / totalProba) * 100}%` }}
                  aria-hidden
                />
                <div
                  className="bg-campB"
                  style={{ width: `${(probaB / totalProba) * 100}%` }}
                  aria-hidden
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Ces probabilités viennent du moteur lui-même : le match est simulé 2 000 fois avant
                d’ouvrir les paris, avec des tirages différents de celui qui sera joué.
              </p>
            </Carte>
          </section>

          {/* Meilleur joueur */}
          {mvp && (
            <Carte className="flex items-center gap-4 p-5">
              <Vignette apparence={mvp} tenue={tenues[mvp.avatar_id]} taille={52} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-display font-semibold">
                  <Award className="h-4 w-4 text-jeton" aria-hidden />
                  Meilleur joueur du match
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {mvp.avatar_nom} — camp {mvp.camp}
                </p>
              </div>
            </Carte>
          )}

          {/* Déroulé */}
          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold">Déroulé du match</h2>
            <Carte className="p-5">
              <TimelineMatch
                evenements={evenements}
                sportSlug={match.sport_slug}
                nomA={nomA}
                nomB={nomB}
              />
            </Carte>
          </section>
        </div>

        {/* --------------------------------------------------- Colonne droite */}
        <aside className="space-y-4 lg:sticky lg:top-20">
          <Carte className="space-y-4 p-5">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <Coins className="h-5 w-5 text-jeton" aria-hidden />
              Paris
            </h2>

            {monPari ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Votre pari</span>
                  <StatutPariBadge statut={monPari.statut} />
                </div>

                <dl className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Camp</dt>
                    <dd className="font-medium">{monPari.camp === 'A' ? nomA : nomB}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Mise</dt>
                    <dd className="font-medium tabular-nums">{formatJetons(monPari.mise)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Cote</dt>
                    <dd className="font-medium tabular-nums">{formatCote(monPari.cote)}</dd>
                  </div>
                  <Separateur className="my-2" />
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">
                      {monPari.statut === 'en_attente' ? 'Gain potentiel' : 'Gain'}
                    </dt>
                    <dd
                      className={cn(
                        'font-display text-lg font-bold tabular-nums',
                        monPari.statut === 'gagne' && 'text-succes',
                        monPari.statut === 'perdu' && 'text-danger',
                      )}
                    >
                      {formatJetons(
                        monPari.statut === 'en_attente' ? monPari.gain_potentiel : monPari.gain_reel,
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : !parisOuverts ? (
              <Alerte>
                {termine
                  ? 'Ce match est terminé, les paris sont clos.'
                  : 'Le match a commencé : les paris sont fermés.'}
              </Alerte>
            ) : !session ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Connectez-vous pour miser vos jetons fictifs sur ce match.
                </p>
                <LienBouton href={`/login?suivant=/matchs/${match.id}`} className="w-full">
                  Se connecter
                </LienBouton>
              </div>
            ) : (
              <FormulairePari
                matchId={match.id}
                coteA={match.cote_a}
                coteB={match.cote_b}
                nomA={nomA}
                nomB={nomB}
                solde={Number(session.profil.solde)}
              />
            )}
          </Carte>

          <Carte className="space-y-2 p-5 text-sm">
            <h2 className="font-display text-lg font-semibold">Informations</h2>
            <dl className="space-y-1.5 text-muted-foreground">
              <div className="flex justify-between gap-3">
                <dt>Coup d’envoi</dt>
                <dd className="text-foreground">{formatDateHeure(match.date_coup_envoi)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Paris placés</dt>
                <dd className="text-foreground tabular-nums">{match.nb_paris}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Total misé</dt>
                <dd className="text-jeton tabular-nums">
                  {formatJetons(Number(match.total_mise))}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Graine</dt>
                <dd className="font-mono text-xs text-foreground">{match.seed}</dd>
              </div>
            </dl>
            <p className="pt-1 text-xs text-muted-foreground">
              La graine fixe le hasard du match : à partir d’elle, le déroulé est reproductible à
              l’identique.
            </p>
          </Carte>
        </aside>
      </div>
    </div>
  )
}
