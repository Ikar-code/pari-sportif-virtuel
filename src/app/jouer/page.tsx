import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { Swords } from 'lucide-react'
import { getMesMatchs, getRechercheEnCours, getSession, getSports, getTenue } from '@/lib/queries'
import { simulerMatchsEnRetard } from '@/lib/simulation/executer'
import { RechercheMatch } from '@/components/recherche-match'
import { Bonhomme } from '@/components/bonhomme'
import { CarteMatch } from '@/components/carte-match'
import { Carte, LienBouton } from '@/components/ui'
import { LIBELLE_STAT } from '@/lib/utils'
import { CLES_STATS } from '@/lib/types'

export const metadata: Metadata = { title: 'Chercher un match' }
export const dynamic = 'force-dynamic'

export default async function PageJouer() {
  const session = await getSession()
  if (!session) redirect('/login?suivant=/jouer')

  // Sans avatar, il n'y a rien à envoyer dans l'arène.
  if (!session.avatar) redirect('/avatar')

  await simulerMatchsEnRetard()

  const [sports, recherche, tenue, mesMatchs] = await Promise.all([
    getSports(),
    getRechercheEnCours(session.profil.id),
    getTenue(session.avatar.id),
    getMesMatchs(session.avatar.id, 5),
  ])

  const avatar = session.avatar

  return (
    <div className="container space-y-8 py-10">
      <header className="space-y-2">
        <h1 className="flex items-center gap-3 font-display text-3xl font-bold sm:text-4xl">
          <Swords className="h-8 w-8 text-neon" aria-hidden />
          Chercher un match
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Le matchmaking cherche des adversaires dont l’elo est proche du vôtre. Une fois le match
          créé, les paris s’ouvrent quelques instants avant le coup d’envoi.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px] lg:items-start">
        <RechercheMatch
          sports={sports}
          elo={avatar.elo}
          rechercheEnCours={Boolean(recherche)}
        />

        {/* ------------------------------------------------ Fiche du joueur */}
        <aside className="space-y-4 lg:sticky lg:top-20">
          <Carte className="flex flex-col items-center gap-3 p-5">
            <Bonhomme apparence={avatar} tenue={tenue} taille={130} />
            <div className="text-center">
              <p className="font-display text-lg font-bold">{avatar.nom}</p>
              <p className="text-sm text-muted-foreground">
                Niveau {avatar.niveau} · {avatar.elo} elo
              </p>
              <p className="text-sm text-muted-foreground">
                {avatar.victoires} V — {avatar.defaites} D
              </p>
            </div>

            <dl className="w-full space-y-1 text-sm">
              {CLES_STATS.map((cle) => (
                <div key={cle} className="flex justify-between">
                  <dt className="text-muted-foreground">{LIBELLE_STAT[cle]}</dt>
                  <dd className="font-medium tabular-nums">{avatar[cle]}</dd>
                </div>
              ))}
            </dl>

            {avatar.points_libres > 0 && (
              <p className="w-full rounded-lg bg-jeton/10 px-3 py-2 text-center text-xs font-medium text-jeton">
                {avatar.points_libres} point{avatar.points_libres > 1 ? 's' : ''} à répartir
              </p>
            )}

            <LienBouton href="/avatar" variante="contour" taille="sm" className="w-full">
              Modifier mon bonhomme
            </LienBouton>
          </Carte>
        </aside>
      </div>

      {/* ------------------------------------------------------ Mes matchs */}
      {mesMatchs.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-2xl font-bold">Mes derniers matchs</h2>
            <LienBouton href="/matchs" variante="fantome" taille="sm">
              Tout voir
            </LienBouton>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mesMatchs.map((match) => (
              <CarteMatch key={match.id} match={match} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
