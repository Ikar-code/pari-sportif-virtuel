import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { Swords } from 'lucide-react'
import { getSession } from '@/lib/queries'
import { FormulaireAuth } from '@/components/formulaire-auth'
import { Alerte, Carte } from '@/components/ui'
import { NOM_DU_JEU } from '@/lib/utils'

export const metadata: Metadata = { title: 'Connexion' }
export const dynamic = 'force-dynamic'

export default async function PageConnexion({
  searchParams,
}: {
  searchParams: Promise<{ suivant?: string; erreur?: string }>
}) {
  const session = await getSession()
  if (session) redirect(session.avatar ? '/jouer' : '/avatar')

  const { suivant, erreur } = await searchParams

  return (
    <div className="container flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-neon to-cyan text-white">
            <Swords className="h-7 w-7" aria-hidden />
          </span>
          <h1 className="font-display text-3xl font-bold">{NOM_DU_JEU}</h1>
          <p className="text-sm text-muted-foreground">
            Votre bonhomme bâton vous attend dans l’arène.
          </p>
        </div>

        {erreur === 'google' && (
          <Alerte ton="danger">
            La connexion Google a échoué. Vérifiez que le fournisseur est bien activé côté Supabase.
          </Alerte>
        )}
        {erreur === 'lien_invalide' && (
          <Alerte ton="danger">Ce lien de confirmation a expiré. Reconnectez-vous.</Alerte>
        )}

        <Carte className="p-6">
          <FormulaireAuth suivant={suivant ?? '/'} />
        </Carte>

        <p className="text-center text-xs text-muted-foreground">
          Les jetons du jeu sont fictifs. Aucun paiement, aucun retrait, aucune valeur réelle.
        </p>
      </div>
    </div>
  )
}
