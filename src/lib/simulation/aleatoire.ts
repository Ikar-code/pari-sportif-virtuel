/**
 * Générateur pseudo-aléatoire déterministe.
 *
 * Le hasard du jeu doit être reproductible : à partir d'une même graine, un
 * match rejoué donne exactement le même déroulé et le même score. C'est ce qui
 * permet de calculer des cotes honnêtes (en simulant le match des centaines de
 * fois avant qu'il n'ait lieu) et de vérifier après coup qu'un résultat n'a pas
 * été bricolé.
 *
 * Math.random() ne convient pas : il n'accepte pas de graine.
 */

export type Aleatoire = {
  /** Flottant dans [0, 1[ */
  suivant: () => number
  /** Entier dans [min, max] inclus */
  entier: (min: number, max: number) => number
  /** Élément au hasard d'un tableau non vide */
  choix: <T>(liste: readonly T[]) => T
  /** Index tiré au sort, chaque entrée pondérée par son poids */
  indexPondere: (poids: readonly number[]) => number
}

/** mulberry32 : court, rapide, largement suffisant pour un jeu. */
export function creerAleatoire(graine: number): Aleatoire {
  let etat = graine >>> 0

  const suivant = () => {
    etat = (etat + 0x6d2b79f5) >>> 0
    let t = etat
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  const entier = (min: number, max: number) => min + Math.floor(suivant() * (max - min + 1))

  const choix = <T,>(liste: readonly T[]): T => liste[Math.floor(suivant() * liste.length)]

  const indexPondere = (poids: readonly number[]) => {
    const total = poids.reduce((s, p) => s + Math.max(0, p), 0)
    if (total <= 0) return Math.floor(suivant() * poids.length)

    let tirage = suivant() * total
    for (let i = 0; i < poids.length; i++) {
      tirage -= Math.max(0, poids[i])
      if (tirage <= 0) return i
    }
    return poids.length - 1
  }

  return { suivant, entier, choix, indexPondere }
}

/** Mélange une graine avec un compteur — utile pour les tirages de Monte-Carlo. */
export function deriverGraine(graine: number, decalage: number) {
  return (Math.imul(graine ^ (decalage + 0x9e3779b9), 0x85ebca6b) >>> 0) % 2147483647
}
