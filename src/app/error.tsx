'use client'

import { useEffect } from 'react'
import { Bouton, LienBouton } from '@/components/ui'

export default function Erreur({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center">
      <span className="text-6xl" aria-hidden>
        🥊
      </span>
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-bold">Une erreur est survenue</h1>
        <p className="max-w-md text-muted-foreground">
          Le serveur n&apos;a pas réussi à charger cette page. Réessayez ; si ça persiste,
          vérifiez la configuration Supabase et la clé de service.
        </p>
        {error.digest && (
          <p className="font-mono text-xs text-muted-foreground">Référence : {error.digest}</p>
        )}
      </div>
      <div className="flex gap-3">
        <Bouton onClick={reset}>Réessayer</Bouton>
        <LienBouton href="/" variante="contour">
          Retour au lobby
        </LienBouton>
      </div>
    </div>
  )
}
