import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { Coins, LogOut, Swords, Wallet } from 'lucide-react'
import { getBilan, getMesMatchs, getSession, getTenue } from '@/lib/queries'
import { simulerMatchsEnRetard } from '@/lib/simulation/executer'
import { deconnexion } from '@/lib/actions/auth'
import { Bonhomme } from '@/components/bonhomme'
import { CarteMatch } from '@/components/carte-match'
import { FormulairePseudo } from '@/components/formulaire-pseudo'
import { Badge, Bouton, Carte, EtatVide, LienBouton, Separateur } from '@/components/ui'
import { formatDateHeure, formatJetons, formatPourcent, LIBELLE_STAT } from '@/lib/utils'
import { CLES_STATS } from '@/lib/types'

export const metadata: Metadata = { title: 'Mon profil' }
export const dynamic = 'force-dynamic'

export default async function PageProfil() {
  const session = await getSession()
  if (!session) redirect('/login?suivant=/profil')

  await simulerMatchsEnRetard()

  const { profil, avatar } = session
  const [tenue, mesMatchs, bilan] = await Promise.all([
    avatar ? getTenue(avatar.id) : Promise.resolve({}),
    avatar ? getMesMatchs(avatar.id, 6) : Promise.resolve([]),
    getBilan(profil.id),
  ])

  return (
    <div className="container space-y-8 py-10">
      {/* ----------------------------------------------------------- En-tête */}
      <header className="flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {avatar ? (
            <Bonhomme apparence={avatar} tenue={tenue} taille={96} />
          ) : (
            <span className="grid h-20 w-20 place-items-center rounded-full bg-muted font-display text-xl font-bold">
              {profil.pseudo.slice(0, 2).toUpperCase()}
            </span>
          )}

          <div className="space-y-1.5">
            <h1 className="font-display text-3xl font-bold">{profil.pseudo}</h1>
            <p className="text-sm text-muted-foreground">{profil.email}</p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge ton="jeton">
                <Coins className="h-3.5 w-3.5" aria-hidden />
                {formatJetons(profil.solde)}
              </Badge>
              {avatar && (
                <>
                  <Badge ton="neon">Niveau {avatar.niveau}</Badge>
                  <Badge ton="cyan">{avatar.elo} elo</Badge>
                </>
              )}
              {profil.role === 'admin' && <Badge ton="danger">Administrateur</Badge>}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <LienBouton href="/portefeuille" variante="contour" taille="sm">
            <Wallet className="h-4 w-4" aria-hidden />
            Portefeuille
          </LienBouton>
          <form action={deconnexion}>
            <Bouton variante="fantome" taille="sm" type="submit">
              <LogOut className="h-4 w-4" aria-hidden />
              Se déconnecter
            </Bouton>
          </form>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="space-y-8">
          {/* ---------------------------------------------- Mon bonhomme */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-2xl font-bold">Mon bonhomme</h2>
              <LienBouton href="/avatar" variante="contour" taille="sm">
                Personnaliser
              </LienBouton>
            </div>

            {avatar ? (
              <Carte className="grid gap-5 p-5 sm:grid-cols-2">
                <dl className="space-y-2 text-sm">
                  {CLES_STATS.map((cle) => (
                    <div key={cle} className="flex items-center justify-between gap-3">
                      <dt className="text-muted-foreground">{LIBELLE_STAT[cle]}</dt>
                      <dd className="font-display font-bold tabular-nums">{avatar[cle]}</dd>
                    </div>
                  ))}
                </dl>

                <dl className="space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">Victoires</dt>
                    <dd className="font-display font-bold tabular-nums text-succes">
                      {avatar.victoires}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">Défaites</dt>
                    <dd className="font-display font-bold tabular-nums">{avatar.defaites}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">Expérience</dt>
                    <dd className="font-display font-bold tabular-nums">
                      {avatar.xp} / {avatar.niveau * 100}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">Points à répartir</dt>
                    <dd className="font-display font-bold tabular-nums text-jeton">
                      {avatar.points_libres}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">Créé le</dt>
                    <dd className="text-foreground">{formatDateHeure(avatar.created_at)}</dd>
                  </div>
                </dl>
              </Carte>
            ) : (
              <EtatVide
                titre="Vous n’avez pas encore de bonhomme"
                texte="Il vous faut un avatar pour entrer en arène."
                action={
                  <LienBouton href="/avatar" taille="sm">
                    Créer mon bonhomme
                  </LienBouton>
                }
              />
            )}
          </section>

          {/* ------------------------------------------------ Mes matchs */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-2xl font-bold">Mes derniers matchs</h2>
              <LienBouton href="/jouer" variante="contour" taille="sm">
                <Swords className="h-4 w-4" aria-hidden />
                Nouveau match
              </LienBouton>
            </div>

            {mesMatchs.length === 0 ? (
              <EtatVide
                titre="Aucun match joué"
                texte="Lancez une recherche : un adversaire de votre niveau vous attend."
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {mesMatchs.map((match) => (
                  <CarteMatch key={match.id} match={match} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* -------------------------------------------------- Colonne droite */}
        <aside className="space-y-4 lg:sticky lg:top-20">
          <Carte className="space-y-4 p-5">
            <h2 className="font-display text-lg font-semibold">Mon compte</h2>
            <Separateur />
            <FormulairePseudo pseudo={profil.pseudo} />
          </Carte>

          <Carte className="space-y-3 p-5">
            <h2 className="font-display text-lg font-semibold">Bilan des paris</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Paris placés</dt>
                <dd className="font-medium tabular-nums">{bilan.nbParis}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Taux de réussite</dt>
                <dd className="font-medium tabular-nums">{formatPourcent(bilan.tauxReussite)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Résultat net</dt>
                <dd className="font-medium tabular-nums">
                  {formatJetons(bilan.resultatNet, { signe: bilan.resultatNet !== 0 })}
                </dd>
              </div>
            </dl>
          </Carte>

          <p className="px-1 text-xs text-muted-foreground">
            Rappel : les jetons sont fictifs. Ils ne s’achètent pas et ne se convertissent en rien.
          </p>
        </aside>
      </div>
    </div>
  )
}
