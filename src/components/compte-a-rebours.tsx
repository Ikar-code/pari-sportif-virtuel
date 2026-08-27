'use client'

import { useEffect, useState } from 'react'
import { compteARebours } from '@/lib/utils'
import { cn } from '@/lib/utils'

/**
 * Compte à rebours jusqu'au coup d'envoi.
 * Rendu côté client uniquement : afficher une heure calculée au rendu serveur
 * provoquerait un décalage d'hydratation dès la première seconde.
 */
export function CompteARebours({
  date,
  className,
  surExpiration,
}: {
  date: string
  className?: string
  /** Appelé une fois quand le compteur atteint zéro. */
  surExpiration?: () => void
}) {
  const [restant, setRestant] = useState<string | null>(null)

  useEffect(() => {
    let expire = false

    const tic = () => {
      const valeur = compteARebours(date)
      setRestant(valeur)
      if (valeur === '00:00' && !expire) {
        expire = true
        surExpiration?.()
      }
    }

    tic()
    const timer = setInterval(tic, 1000)
    return () => clearInterval(timer)
  }, [date, surExpiration])

  return (
    <span className={cn('tabular-nums', className)}>
      {restant ?? '--:--'}
    </span>
  )
}
