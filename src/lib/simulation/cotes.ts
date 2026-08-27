import { deriverGraine } from './aleatoire'
import { simulerMatch, type ConfigMatch } from './moteur'
import { borner } from '@/lib/utils'

/**
 * Calcul des cotes.
 *
 * Plutôt que d'inventer une formule à partir de l'elo, on fait tourner le vrai
 * moteur quelques centaines de fois avec des graines différentes de celle du
 * match. On obtient la probabilité réelle de victoire telle que le jeu la
 * produit — donc des cotes cohérentes avec ce qui va effectivement se passer,
 * sans jamais connaître le résultat du match à venir.
 */

/** Marge de la maison : ce qui fait que la somme des probabilités dépasse 100 %. */
export const MARGE = 0.06

/**
 * Nombre de simulations par cote.
 *
 * Mesuré sur un 4v4 de 24 actions : 400 tirages donnent une cote qui oscille
 * de 1,73 à 2,15 entre deux matchs pourtant identiques — trop bruyant pour un
 * jeu de paris. 2 000 tirages ramènent l'amplitude à 0,16 pour 85 ms de calcul,
 * et ça ne tourne qu'une fois, à la création du match.
 */
const NB_SIMULATIONS = 2000

export type Cotes = {
  probaA: number
  coteA: number
  coteB: number
}

export function calculerCotes(config: ConfigMatch, nbSimulations = NB_SIMULATIONS): Cotes {
  let victoiresA = 0

  for (let i = 1; i <= nbSimulations; i++) {
    const { scoreA, scoreB } = simulerMatch({
      ...config,
      // On dérive une graine différente de celle du match réel : les cotes ne
      // doivent surtout pas être calculées sur le match qui sera joué.
      seed: deriverGraine(config.seed, i * 7919),
    })

    if (scoreA > scoreB) victoiresA += 1
    else if (scoreA === scoreB) victoiresA += 0.5
  }

  // On borne : une cote doit rester payante, même sur un match très déséquilibré.
  const probaA = borner(victoiresA / nbSimulations, 0.05, 0.95)

  return {
    probaA: Number(probaA.toFixed(4)),
    coteA: coteDepuisProbabilite(probaA),
    coteB: coteDepuisProbabilite(1 - probaA),
  }
}

export function coteDepuisProbabilite(probabilite: number) {
  const brute = (1 / borner(probabilite, 0.01, 0.99)) * (1 - MARGE)
  return Number(Math.max(1.01, brute).toFixed(2))
}

/** Probabilité implicite d'une cote, marge retirée — pour l'affichage. */
export function probabiliteDepuisCote(cote: number) {
  return borner((1 - MARGE) / cote, 0, 1)
}
