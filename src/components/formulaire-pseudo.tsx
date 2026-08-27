'use client'

import { useActionState } from 'react'
import { modifierPseudo } from '@/lib/actions/profil'
import { Alerte, ChampFormulaire, Input } from '@/components/ui'
import { BoutonEnvoi } from '@/components/bouton-envoi'
import type { EtatAction } from '@/lib/types'

export function FormulairePseudo({ pseudo }: { pseudo: string }) {
  const [etat, action] = useActionState<EtatAction, FormData>(modifierPseudo, null)

  return (
    <form action={action} className="space-y-3">
      {etat && <Alerte ton={etat.ok ? 'succes' : 'danger'}>{etat.message}</Alerte>}

      <ChampFormulaire label="Pseudo" htmlFor="pseudo" aide="Affiché au classement.">
        <Input id="pseudo" name="pseudo" defaultValue={pseudo} minLength={3} maxLength={24} required />
      </ChampFormulaire>

      <BoutonEnvoi taille="sm" enCours="Enregistrement…">
        Enregistrer
      </BoutonEnvoi>
    </form>
  )
}
