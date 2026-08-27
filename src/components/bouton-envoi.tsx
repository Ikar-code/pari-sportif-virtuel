'use client'

import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'
import { Bouton } from '@/components/ui'
import type { ComponentProps } from 'react'

/** Bouton de soumission qui se verrouille pendant l'exécution de l'action. */
export function BoutonEnvoi({
  children,
  enCours,
  disabled,
  ...props
}: ComponentProps<typeof Bouton> & { enCours?: string }) {
  const { pending } = useFormStatus()

  return (
    <Bouton type="submit" disabled={pending || disabled} {...props}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {pending ? (enCours ?? 'Envoi…') : children}
    </Bouton>
  )
}
