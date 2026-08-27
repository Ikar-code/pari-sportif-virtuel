import Link from 'next/link'
import type { Metadata } from 'next'
import { Swords } from 'lucide-react'
import { getMatchs, getParticipantsPourMatchs, getSession, getSports } from '@/lib/queries'
import { simulerMatchsEnRetard } from '@/lib/simulation/executer'
import { CarteMatch } from '@/components/carte-match'
import { EtatVide, LienBouton } from '@/components/ui'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Matchs' }
export const dynamic = 'force-dynamic'

const ONGLETS = [
  { cle: '', label: 'Tous' },
  { cle: 'a_venir', label: 'Paris ouverts' },
  { cle: 'en_cours', label: 'En cours' },
  { cle: 'termine', label: 'Terminés' },
]

export default async function PageMatchs({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; sport?: string }>
}) {
  // Les matchs dont l'heure est passée se jouent au premier chargement de page :
  // pas de tâche planifiée à maintenir pour un projet hébergé sur Vercel.
  await simulerMatchsEnRetard()

  const [{ statut, sport }, sports, session] = await Promise.all([
    searchParams,
    getSports(),
    getSession(),
  ])

  const matchs = await getMatchs({ statut, sport, limite: 36 })
  const participants = await getParticipantsPourMatchs(matchs.map((m) => m.id))

  const lien = (modifs: { statut?: string; sport?: string }) => {
    const params = new URLSearchParams()
    const s = modifs.statut ?? statut
    const sp = modifs.sport ?? sport
    if (s) params.set('statut', s)
    if (sp) params.set('sport', sp)
    const qs = params.toString()
    return qs ? `/matchs?${qs}` : '/matchs'
  }

  return (
    <div className="container space-y-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Matchs</h1>
          <p className="text-muted-foreground">
            Les rencontres de l’arène et leurs cotes, calculées par le moteur de simulation.
          </p>
        </div>
        <LienBouton href={session ? '/jouer' : '/login'}>
          <Swords className="h-4 w-4" aria-hidden />
          Lancer un match
        </LienBouton>
      </header>

      <nav className="flex flex-wrap gap-1 rounded-lg bg-muted p-1" aria-label="Filtrer par statut">
        {ONGLETS.map((o) => (
          <Link
            key={o.cle || 'tous'}
            href={lien({ statut: o.cle })}
            className={cn(
              'rounded-md px-4 py-2 text-sm font-medium transition-colors',
              (statut ?? '') === o.cle
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {o.label}
          </Link>
        ))}
      </nav>

      <nav className="flex flex-wrap gap-2" aria-label="Filtrer par discipline">
        <Link
          href={lien({ sport: '' })}
          className={cn(
            'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
            !sport ? 'border-neon bg-neon text-neon-foreground' : 'border-border bg-card hover:bg-muted',
          )}
        >
          Toutes disciplines
        </Link>
        {sports.map((s) => (
          <Link
            key={s.id}
            href={lien({ sport: s.slug ?? '' })}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
              sport === s.slug
                ? 'border-neon bg-neon text-neon-foreground'
                : 'border-border bg-card hover:bg-muted',
            )}
          >
            <span aria-hidden>{s.icone}</span> {s.nom}
          </Link>
        ))}
      </nav>

      {matchs.length === 0 ? (
        <EtatVide
          icone={<Swords className="h-10 w-10" />}
          titre="Aucun match ici"
          texte="Lancez une recherche : le matchmaking vous trouve un adversaire de votre niveau en quelques secondes."
          action={
            <LienBouton href={session ? '/jouer' : '/login'} taille="sm">
              Chercher un match
            </LienBouton>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {matchs.map((match) => (
            <CarteMatch key={match.id} match={match} participants={participants[match.id]} />
          ))}
        </div>
      )}
    </div>
  )
}
