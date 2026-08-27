import Link from 'next/link'
import type { Metadata } from 'next'
import { Coins, Dices, Sparkles, Swords, Trophy, Users } from 'lucide-react'
import {
  getClassement,
  getMatchs,
  getParticipantsPourMatchs,
  getSession,
  getSports,
  getStatsAccueil,
  getTenue,
} from '@/lib/queries'
import { simulerMatchsEnRetard } from '@/lib/simulation/executer'
import { CarteMatch } from '@/components/carte-match'
import { Bonhomme, Vignette } from '@/components/bonhomme'
import { Badge, Carte, EtatVide, LienBouton } from '@/components/ui'
import { formatJetons, NOM_DU_JEU } from '@/lib/utils'

export const metadata: Metadata = { title: 'Accueil' }
export const dynamic = 'force-dynamic'

const ETAPES = [
  {
    icone: Users,
    titre: 'Créez votre bonhomme',
    texte: '50 points à répartir sur cinq statistiques. C’est votre seule vraie décision.',
  },
  {
    icone: Swords,
    titre: 'Trouvez un adversaire',
    texte: 'Le matchmaking cherche un niveau proche du vôtre, en 1v1, 2v2 ou 4v4.',
  },
  {
    icone: Dices,
    titre: 'Le moteur simule',
    texte: 'Les statistiques et un peu de hasard décident du déroulé, action par action.',
  },
  {
    icone: Coins,
    titre: 'Pariez, encaissez',
    texte: 'Misez des jetons fictifs avant le coup d’envoi, aux cotes calculées par le moteur.',
  },
]

export default async function PageAccueil() {
  await simulerMatchsEnRetard()

  const [session, aVenir, recents, classement, sports, stats] = await Promise.all([
    getSession(),
    getMatchs({ statut: 'a_venir', limite: 6, ordre: 'asc' }),
    getMatchs({ statut: 'termine', limite: 3 }),
    getClassement(5),
    getSports(),
    getStatsAccueil(),
  ])

  const participants = await getParticipantsPourMatchs(
    [...aVenir, ...recents].map((m) => m.id),
  )
  const tenue = session?.avatar ? await getTenue(session.avatar.id) : undefined

  return (
    <>
      {/* ------------------------------------------------------------- Hero */}
      <section className="border-b border-border bg-gradient-to-b from-neon/10 via-cyan/5 to-transparent">
        <div className="container grid gap-10 py-14 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:py-20">
          <div className="space-y-6 animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-cyan" aria-hidden />
              {stats.sports} disciplines · {stats.matchsJoues} matchs joués
            </span>

            <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Envoyez votre <span className="texte-neon">bonhomme bâton</span> dans l’arène
            </h1>

            <p className="max-w-xl text-lg text-muted-foreground">
              Des matchs simulés en 1v1, 2v2 ou 4v4, des adversaires à votre niveau, et des paris
              en monnaie <strong className="text-foreground">100 % fictive</strong>. Aucun euro
              n’entre ni ne sort : c’est un jeu.
            </p>

            <div className="flex flex-wrap gap-3">
              {session ? (
                <LienBouton href={session.avatar ? '/jouer' : '/avatar'} taille="lg">
                  <Swords className="h-5 w-5" aria-hidden />
                  {session.avatar ? 'Chercher un match' : 'Créer mon bonhomme'}
                </LienBouton>
              ) : (
                <LienBouton href="/login" taille="lg">
                  <Swords className="h-5 w-5" aria-hidden />
                  Commencer — 1 000 jetons offerts
                </LienBouton>
              )}
              <LienBouton href="/matchs" variante="contour" taille="lg">
                Voir les matchs
              </LienBouton>
            </div>
          </div>

          {/* Aperçu : l'avatar du joueur, ou une démonstration */}
          <Carte className="grille-arene flex flex-col items-center gap-4 p-8">
            {session?.avatar ? (
              <>
                <Bonhomme apparence={session.avatar} tenue={tenue} taille={180} anime />
                <div className="text-center">
                  <p className="font-display text-xl font-bold">{session.avatar.nom}</p>
                  <p className="text-sm text-muted-foreground">
                    Niveau {session.avatar.niveau} · {session.avatar.elo} elo ·{' '}
                    {session.avatar.victoires} V / {session.avatar.defaites} D
                  </p>
                </div>
                <LienBouton href="/avatar" variante="contour" taille="sm">
                  Personnaliser
                </LienBouton>
              </>
            ) : (
              <>
                <div className="flex items-end gap-6">
                  <Bonhomme
                    apparence={{
                      couleur_corps: '#7C5CFF',
                      couleur_tete: '#FFD9A0',
                      couleur_accent: '#FFB020',
                    }}
                    tenue={{
                      chapeau: {
                        id: 'demo-1',
                        nom: 'Couronne',
                        slug: null,
                        categorie: 'chapeau',
                        rarete: 'legendaire',
                        prix: 0,
                        donnees: { forme: 'couronne', couleur: '#FFB020' },
                        description: null,
                        actif: true,
                        created_at: '',
                      },
                    }}
                    taille={150}
                    anime
                  />
                  <Bonhomme
                    apparence={{
                      couleur_corps: '#22D3EE',
                      couleur_tete: '#C68642',
                      couleur_accent: '#EF4444',
                    }}
                    tenue={{
                      visage: {
                        id: 'demo-2',
                        nom: 'Lunettes de soleil',
                        slug: null,
                        categorie: 'visage',
                        rarete: 'rare',
                        prix: 0,
                        donnees: { forme: 'lunettes-soleil', couleur: '#111827' },
                        description: null,
                        actif: true,
                        created_at: '',
                      },
                    }}
                    taille={150}
                    regardeAGauche
                  />
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  Couleurs, statistiques, chapeaux, capes et auras : chaque bonhomme est le vôtre.
                </p>
              </>
            )}
          </Carte>
        </div>
      </section>

      {/* -------------------------------------------------- Comment ça marche */}
      <section className="container py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ETAPES.map(({ icone: Icone, titre, texte }, index) => (
            <Carte key={titre} className="space-y-2 p-5">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-neon/10 text-neon">
                  <Icone className="h-5 w-5" aria-hidden />
                </span>
                <span className="font-display text-sm font-bold text-muted-foreground">
                  0{index + 1}
                </span>
              </div>
              <p className="font-display font-semibold">{titre}</p>
              <p className="text-sm text-muted-foreground">{texte}</p>
            </Carte>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------ Paris ouverts */}
      <section className="container space-y-4 pb-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold">Paris ouverts</h2>
            <p className="text-sm text-muted-foreground">
              Les matchs dont le coup d’envoi n’a pas encore été donné.
            </p>
          </div>
          <Link href="/matchs" className="text-sm font-medium text-cyan hover:underline">
            Tous les matchs →
          </Link>
        </div>

        {aVenir.length === 0 ? (
          <EtatVide
            icone={<Swords className="h-10 w-10" />}
            titre="Aucun match en attente"
            texte="Lancez-en un : le matchmaking vous trouve un adversaire en quelques secondes."
            action={
              <LienBouton href={session ? '/jouer' : '/login'} taille="sm">
                Chercher un match
              </LienBouton>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {aVenir.map((match) => (
              <CarteMatch key={match.id} match={match} participants={participants[match.id]} />
            ))}
          </div>
        )}
      </section>

      {/* ------------------------------------------- Classement + disciplines */}
      <section className="container grid gap-6 pb-16 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="space-y-4">
          <h2 className="font-display text-2xl font-bold">Derniers résultats</h2>
          {recents.length === 0 ? (
            <EtatVide titre="Aucun match terminé pour l’instant" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recents.map((match) => (
                <CarteMatch key={match.id} match={match} participants={participants[match.id]} />
              ))}
            </div>
          )}

          <h2 className="pt-4 font-display text-2xl font-bold">Les disciplines</h2>
          <div className="flex flex-wrap gap-2">
            {sports.map((s) => (
              <Link
                key={s.id}
                href={`/matchs?sport=${s.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm transition-colors hover:bg-muted"
              >
                <span aria-hidden>{s.icone}</span>
                {s.nom}
                <span className="text-xs text-muted-foreground">
                  {s.formats.map((f) => `${f}v${f}`).join('/')}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <Carte className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                <Trophy className="h-5 w-5 text-jeton" aria-hidden />
                Top 5
              </h2>
              <Link href="/classement" className="text-sm text-cyan hover:underline">
                Voir tout
              </Link>
            </div>

            <ol className="divide-y divide-border">
              {classement.map((ligne, index) => (
                <li key={ligne.avatar_id} className="flex items-center gap-3 px-5 py-3">
                  <span className="w-4 font-display font-bold tabular-nums text-muted-foreground">
                    {index + 1}
                  </span>
                  <Vignette apparence={ligne} taille={32} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{ligne.nom}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {ligne.est_bot ? 'machine' : (ligne.proprietaire_pseudo ?? 'joueur')}
                    </p>
                  </div>
                  <Badge ton={index === 0 ? 'jeton' : 'neutre'}>{ligne.elo}</Badge>
                </li>
              ))}
              {classement.length === 0 && (
                <li className="px-5 py-6 text-sm text-muted-foreground">
                  Le classement se remplira dès les premiers matchs.
                </li>
              )}
            </ol>
          </Carte>

          {session && (
            <Carte className="space-y-2 p-5">
              <p className="text-sm text-muted-foreground">Votre solde</p>
              <p className="flex items-center gap-2 font-display text-3xl font-bold tabular-nums text-jeton">
                <Coins className="h-6 w-6" aria-hidden />
                {formatJetons(session.profil.solde)}
              </p>
              <LienBouton href="/portefeuille" variante="contour" taille="sm" className="w-full">
                Voir le portefeuille
              </LienBouton>
            </Carte>
          )}

          <Carte className="space-y-2 p-5 text-sm text-muted-foreground">
            <p className="font-display font-semibold text-foreground">
              Pourquoi {NOM_DU_JEU} n’est pas un site d’argent
            </p>
            <p>
              Les jetons ne s’achètent pas, ne se vendent pas et ne se convertissent en rien. Le
              bonus quotidien en redonne à tout le monde : personne ne peut perdre autre chose que
              du temps de jeu.
            </p>
          </Carte>
        </aside>
      </section>
    </>
  )
}
