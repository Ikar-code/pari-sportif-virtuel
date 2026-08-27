'use client'

import { useActionState, useState } from 'react'
import { connexion, connexionGoogle, inscription } from '@/lib/actions/auth'
import { Alerte, ChampFormulaire, Input, Separateur } from '@/components/ui'
import { BoutonEnvoi } from '@/components/bouton-envoi'
import { cn } from '@/lib/utils'
import type { EtatAction } from '@/lib/types'

type Onglet = 'connexion' | 'inscription'

/** Logo Google — inline, pour éviter une requête vers un domaine externe. */
function LogoGoogle() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.5 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.4 14.4a7.2 7.2 0 0 1 0-4.6V6.7H1.4a12 12 0 0 0 0 10.8l4-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0A12 12 0 0 0 1.4 6.7l4 3.1C6.3 6.9 8.9 4.8 12 4.8Z"
      />
    </svg>
  )
}

export function FormulaireAuth({ suivant }: { suivant: string }) {
  const [onglet, setOnglet] = useState<Onglet>('connexion')

  const [etatConnexion, actionConnexion] = useActionState<EtatAction, FormData>(connexion, null)
  const [etatInscription, actionInscription] = useActionState<EtatAction, FormData>(
    inscription,
    null,
  )

  const etat = onglet === 'connexion' ? etatConnexion : etatInscription

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1" role="tablist">
        {(['connexion', 'inscription'] as const).map((valeur) => (
          <button
            key={valeur}
            type="button"
            role="tab"
            aria-selected={onglet === valeur}
            onClick={() => setOnglet(valeur)}
            className={cn(
              'rounded-md px-3 py-2 text-sm font-medium transition-colors',
              onglet === valeur
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {valeur === 'connexion' ? 'Se connecter' : 'Créer un compte'}
          </button>
        ))}
      </div>

      {etat && <Alerte ton={etat.ok ? 'succes' : 'danger'}>{etat.message}</Alerte>}

      {/* Connexion Google : un simple <form> qui appelle la Server Action */}
      <form action={connexionGoogle}>
        <BoutonEnvoi variante="contour" className="w-full" enCours="Redirection…">
          <LogoGoogle />
          Continuer avec Google
        </BoutonEnvoi>
      </form>

      <div className="relative">
        <Separateur />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs uppercase tracking-wide text-muted-foreground">
          ou
        </span>
      </div>

      {onglet === 'connexion' ? (
        <form action={actionConnexion} className="space-y-4">
          <input type="hidden" name="suivant" value={suivant} />

          <ChampFormulaire label="Adresse e-mail" htmlFor="email" obligatoire>
            <Input id="email" name="email" type="email" autoComplete="email" required placeholder="vous@exemple.fr" />
          </ChampFormulaire>

          <ChampFormulaire label="Mot de passe" htmlFor="mot_de_passe" obligatoire>
            <Input
              id="mot_de_passe"
              name="mot_de_passe"
              type="password"
              autoComplete="current-password"
              required
            />
          </ChampFormulaire>

          <BoutonEnvoi className="w-full" taille="lg" enCours="Connexion…">
            Entrer dans l’arène
          </BoutonEnvoi>
        </form>
      ) : (
        <form action={actionInscription} className="space-y-4">
          <ChampFormulaire label="Pseudo" htmlFor="pseudo" obligatoire aide="Visible au classement.">
            <Input id="pseudo" name="pseudo" required minLength={3} maxLength={24} placeholder="BatonMax" />
          </ChampFormulaire>

          <ChampFormulaire label="Adresse e-mail" htmlFor="email_inscription" obligatoire>
            <Input
              id="email_inscription"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="vous@exemple.fr"
            />
          </ChampFormulaire>

          <ChampFormulaire
            label="Mot de passe"
            htmlFor="mot_de_passe_inscription"
            obligatoire
            aide="8 caractères minimum."
          >
            <Input
              id="mot_de_passe_inscription"
              name="mot_de_passe"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </ChampFormulaire>

          <BoutonEnvoi className="w-full" taille="lg" enCours="Création…">
            Créer mon compte
          </BoutonEnvoi>

          <p className="text-center text-xs text-muted-foreground">
            1 000 jetons fictifs offerts à l’inscription.
          </p>
        </form>
      )}
    </div>
  )
}
