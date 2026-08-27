import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowDownRight, ArrowUpRight, Coins, Wallet } from 'lucide-react'
import { getBilan, getMesParis, getSession, getTransactions } from '@/lib/queries'
import { simulerMatchsEnRetard } from '@/lib/simulation/executer'
import { BoutonBonus } from '@/components/bouton-bonus'
import { StatutPariBadge } from '@/components/statut-badge'
import { Badge, Carte, EtatVide, LienBouton, Separateur, Tableau, Td, Th } from '@/components/ui'
import {
  cn,
  formatCote,
  formatDateHeure,
  formatJetons,
  formatPourcent,
  LIBELLE_TRANSACTION,
} from '@/lib/utils'

export const metadata: Metadata = { title: 'Portefeuille' }
export const dynamic = 'force-dynamic'

export default async function PagePortefeuille() {
  const session = await getSession()
  if (!session) redirect('/login?suivant=/portefeuille')

  // Un pari en attente peut porter sur un match dont l'heure est déjà passée.
  await simulerMatchsEnRetard()

  const [paris, transactions, bilan] = await Promise.all([
    getMesParis(session.profil.id),
    getTransactions(session.profil.id),
    getBilan(session.profil.id),
  ])

  const bonusDisponible =
    !session.profil.dernier_bonus_at ||
    Date.now() - new Date(session.profil.dernier_bonus_at).getTime() > 20 * 3600 * 1000

  return (
    <div className="container space-y-8 py-10">
      <header className="space-y-2">
        <h1 className="flex items-center gap-3 font-display text-3xl font-bold sm:text-4xl">
          <Wallet className="h-8 w-8 text-jeton" aria-hidden />
          Portefeuille
        </h1>
        <p className="text-muted-foreground">
          Vos jetons fictifs, vos paris et l’historique de tous les mouvements.
        </p>
      </header>

      {/* --------------------------------------------------------- Le solde */}
      <div className="grid gap-4 md:grid-cols-[1fr_280px] md:items-start">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Carte className="p-5">
            <p className="text-sm text-muted-foreground">Solde</p>
            <p className="flex items-center gap-2 font-display text-3xl font-bold tabular-nums text-jeton">
              <Coins className="h-6 w-6" aria-hidden />
              {formatJetons(session.profil.solde)}
            </p>
          </Carte>

          <Carte className="p-5">
            <p className="text-sm text-muted-foreground">Résultat net</p>
            <p
              className={cn(
                'font-display text-3xl font-bold tabular-nums',
                bilan.resultatNet > 0 && 'text-succes',
                bilan.resultatNet < 0 && 'text-danger',
              )}
            >
              {formatJetons(bilan.resultatNet, { signe: bilan.resultatNet !== 0 })}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatJetons(bilan.totalGains)} gagnés pour {formatJetons(bilan.totalMise)} misés
            </p>
          </Carte>

          <Carte className="p-5">
            <p className="text-sm text-muted-foreground">Paris gagnés</p>
            <p className="font-display text-3xl font-bold tabular-nums">
              {bilan.nbGagnes}
              <span className="text-lg text-muted-foreground"> / {bilan.nbParis}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {formatPourcent(bilan.tauxReussite)} de réussite
            </p>
          </Carte>

          <Carte className="p-5">
            <p className="text-sm text-muted-foreground">En jeu</p>
            <p className="font-display text-3xl font-bold tabular-nums">{bilan.nbEnAttente}</p>
            <p className="text-xs text-muted-foreground">paris en attente de résultat</p>
          </Carte>
        </div>

        <Carte className="space-y-3 p-5">
          <p className="font-display font-semibold">Bonus quotidien</p>
          <p className="text-sm text-muted-foreground">
            À court de jetons ? Le jeu vous en redonne toutes les 20 heures — impossible de rester
            bloqué.
          </p>
          <BoutonBonus disponible={bonusDisponible} />
        </Carte>
      </div>

      {/* --------------------------------------------------------- Mes paris */}
      <section className="space-y-3">
        <h2 className="font-display text-2xl font-bold">Mes paris</h2>

        {paris.length === 0 ? (
          <EtatVide
            titre="Aucun pari pour l’instant"
            texte="Ouvrez un match dont les paris sont ouverts et misez quelques jetons."
            action={
              <LienBouton href="/matchs" taille="sm">
                Voir les matchs
              </LienBouton>
            }
          />
        ) : (
          <Carte className="overflow-hidden">
            <Tableau>
              <thead>
                <tr>
                  <Th>Match</Th>
                  <Th className="w-20">Camp</Th>
                  <Th className="w-24 text-right">Mise</Th>
                  <Th className="hidden w-20 text-right sm:table-cell">Cote</Th>
                  <Th className="w-28 text-right">Gain</Th>
                  <Th className="w-28">Statut</Th>
                </tr>
              </thead>
              <tbody>
                {paris.map((pari) => (
                  <tr key={pari.id}>
                    <Td>
                      {pari.matchs ? (
                        <Link href={`/matchs/${pari.matchs.id}`} className="hover:underline">
                          <span className="mr-1.5" aria-hidden>
                            {pari.matchs.sports?.icone}
                          </span>
                          {pari.matchs.sports?.nom ?? 'Match'}
                          {pari.matchs.score_a !== null && (
                            <span className="ml-2 tabular-nums text-muted-foreground">
                              {pari.matchs.score_a} — {pari.matchs.score_b}
                            </span>
                          )}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">Match supprimé</span>
                      )}
                      <span className="block text-xs text-muted-foreground">
                        {formatDateHeure(pari.created_at)}
                      </span>
                    </Td>
                    <Td>
                      <Badge ton={pari.camp === 'A' ? 'neon' : 'cyan'}>{pari.camp}</Badge>
                    </Td>
                    <Td className="text-right tabular-nums">{formatJetons(pari.mise)}</Td>
                    <Td className="hidden text-right tabular-nums sm:table-cell">
                      {formatCote(pari.cote)}
                    </Td>
                    <Td
                      className={cn(
                        'text-right font-medium tabular-nums',
                        pari.statut === 'gagne' && 'text-succes',
                        pari.statut === 'perdu' && 'text-muted-foreground',
                      )}
                    >
                      {pari.statut === 'en_attente'
                        ? `≈ ${formatJetons(pari.gain_potentiel)}`
                        : formatJetons(pari.gain_reel)}
                    </Td>
                    <Td>
                      <StatutPariBadge statut={pari.statut} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Tableau>
          </Carte>
        )}
      </section>

      <Separateur />

      {/* ------------------------------------------------------- Historique */}
      <section className="space-y-3">
        <h2 className="font-display text-2xl font-bold">Historique des mouvements</h2>

        {transactions.length === 0 ? (
          <EtatVide titre="Aucun mouvement" />
        ) : (
          <Carte className="divide-y divide-border">
            {transactions.map((t) => {
              const entree = Number(t.montant) >= 0
              return (
                <div key={t.id} className="flex items-center gap-3 px-5 py-3">
                  <span
                    className={cn(
                      'grid h-9 w-9 shrink-0 place-items-center rounded-full',
                      entree ? 'bg-succes/10 text-succes' : 'bg-muted text-muted-foreground',
                    )}
                    aria-hidden
                  >
                    {entree ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {t.libelle || LIBELLE_TRANSACTION[t.type]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {LIBELLE_TRANSACTION[t.type]} · {formatDateHeure(t.created_at)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p
                      className={cn(
                        'font-display font-bold tabular-nums',
                        entree ? 'text-succes' : 'text-foreground',
                      )}
                    >
                      {formatJetons(Number(t.montant), { signe: true })}
                    </p>
                    <p className="text-xs tabular-nums text-muted-foreground">
                      solde {formatJetons(Number(t.solde_apres))}
                    </p>
                  </div>
                </div>
              )
            })}
          </Carte>
        )}
      </section>
    </div>
  )
}
