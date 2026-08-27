import { LienBouton } from '@/components/ui'
import { Bonhomme } from '@/components/bonhomme'

export default function PageIntrouvable() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center">
      <Bonhomme
        apparence={{
          couleur_corps: '#7C5CFF',
          couleur_tete: '#FFD9A0',
          couleur_accent: '#22D3EE',
        }}
        taille={130}
        anime
      />
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-bold">Page introuvable</h1>
        <p className="max-w-md text-muted-foreground">
          Ce bonhomme cherche partout, mais cette page n&apos;existe pas.
        </p>
      </div>
      <div className="flex gap-3">
        <LienBouton href="/">Retour au lobby</LienBouton>
        <LienBouton href="/matchs" variante="contour">
          Voir les matchs
        </LienBouton>
      </div>
    </div>
  )
}
