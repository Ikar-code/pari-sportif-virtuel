'use client'

import { useActionState } from 'react'
import { Gift } from 'lucide-react'
import { reclamerBonus } from '@/lib/actions/boutique'
import { Alerte } from '@/components/ui'
import { BoutonEnvoi } from '@/components/bouton-envoi'
import type { EtatAction } from '@/lib/types'

/** Bonus quotidien : 250 jetons toutes les 20 heures. */
export function BoutonBonus({ disponible }: { disponible: boolean }) {
  const [etat, action] = useActionState<EtatAction, FormData>(
    async (precedent) => reclamerBonus(precedent),
    null,
  )

  // Une fois réclamé dans la page, le bouton reste verrouillé jusqu'au rechargement.
  const verrouille = !disponible || etat?.ok === true

  return (
    <div className="space-y-2">
      <form action={action}>
        <BoutonEnvoi
          variante={verrouille ? 'contour' : 'jeton'}
          className="w-full"
          enCours="En cours…"
          disabled={verrouille}
        >
          <Gift className="h-4 w-4" aria-hidden />
          {verrouille ? 'Bonus déjà réclamé' : 'Réclamer mes 250 jetons'}
        </BoutonEnvoi>
      </form>

      {etat && <Alerte ton={etat.ok ? 'succes' : 'alerte'}>{etat.message}</Alerte>}
    </div>
  )
}
