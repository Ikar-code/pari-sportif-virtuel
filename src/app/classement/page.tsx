import Link from 'next/link'
import type { Metadata } from 'next'
import { Bot, Trophy } from 'lucide-react'
import { getClassement, getSession } from '@/lib/queries'
import { Vignette } from '@/components/bonhomme'
import { Badge, Carte, EtatVide, Tableau, Td, Th } from '@/components/ui'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Classement' }
export const dynamic = 'force-dynamic'

export default async function PageClassement({
  searchParams,
}: {
  searchParams: Promise<{ filtre?: string }>
}) {
  const [{ filtre }, session] = await Promise.all([searchParams, getSession()])
  const humainsSeulement = filtre === 'joueurs'

  const classement = await getClassement(50, humainsSeulement)
  const monAvatarId = session?.avatar?.id

  return (
    <div className="container space-y-6 py-10">
      <header className="space-y-2">
        <h1 className="flex items-center gap-3 font-display text-3xl font-bold sm:text-4xl">
          <Trophy className="h-8 w-8 text-jeton" aria-hidden />
          Classement
        </h1>
        <p className="text-muted-foreground">
          Les bonshommes triés par elo. C’est cette valeur que le matchmaking utilise pour vous
          trouver un adversaire à votre mesure.
        </p>
      </header>

      <nav className="flex gap-1 rounded-lg bg-muted p-1" aria-label="Filtrer le classement">
        {[
          { cle: '', label: 'Tout le monde' },
          { cle: 'joueurs', label: 'Joueurs uniquement' },
        ].map((o) => (
          <Link
            key={o.cle || 'tous'}
            href={o.cle ? `/classement?filtre=${o.cle}` : '/classement'}
            className={cn(
              'rounded-md px-4 py-2 text-sm font-medium transition-colors',
              (filtre ?? '') === o.cle
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {o.label}
          </Link>
        ))}
      </nav>

      {classement.length === 0 ? (
        <EtatVide
          icone={<Trophy className="h-10 w-10" />}
          titre="Classement vide"
          texte="Aucun bonhomme n’a encore combattu."
        />
      ) : (
        <Carte className="overflow-hidden">
          <Tableau>
            <thead>
              <tr>
                <Th className="w-14">#</Th>
                <Th>Bonhomme</Th>
                <Th className="hidden sm:table-cell">Joueur</Th>
                <Th className="w-20 text-right">Niveau</Th>
                <Th className="hidden w-28 text-right md:table-cell">V / D</Th>
                <Th className="w-24 text-right">Elo</Th>
              </tr>
            </thead>
            <tbody>
              {classement.map((ligne, index) => (
                <tr
                  key={ligne.avatar_id}
                  className={cn(
                    ligne.avatar_id === monAvatarId && 'bg-neon/5',
                    index < 3 && 'bg-jeton/5',
                  )}
                >
                  <Td>
                    <span className="font-display font-bold tabular-nums text-muted-foreground">
                      {index + 1}
                    </span>
                  </Td>
                  <Td>
                    <span className="flex items-center gap-3">
                      <Vignette apparence={ligne} taille={34} />
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{ligne.nom}</span>
                        <span className="block text-xs text-muted-foreground">
                          {ligne.taux_victoire}% de victoires
                        </span>
                      </span>
                    </span>
                  </Td>
                  <Td className="hidden sm:table-cell">
                    {ligne.est_bot ? (
                      <Badge ton="neutre">
                        <Bot className="h-3.5 w-3.5" aria-hidden />
                        machine
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {ligne.proprietaire_pseudo ?? '—'}
                      </span>
                    )}
                  </Td>
                  <Td className="text-right tabular-nums">{ligne.niveau}</Td>
                  <Td className="hidden text-right tabular-nums text-muted-foreground md:table-cell">
                    {ligne.victoires} / {ligne.defaites}
                  </Td>
                  <Td className="text-right">
                    <Badge ton={index < 3 ? 'jeton' : 'neutre'}>
                      <span className="font-display font-bold tabular-nums">{ligne.elo}</span>
                    </Badge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Tableau>
        </Carte>
      )}
    </div>
  )
}
