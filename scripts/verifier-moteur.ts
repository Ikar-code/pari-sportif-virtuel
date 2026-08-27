/**
 * Vérification du moteur de simulation.
 *
 *   npx tsx scripts/verifier-moteur.ts
 *
 * Ne touche pas à la base : tout se joue en mémoire. À lancer après chaque
 * modification de `src/lib/simulation/` pour s'assurer que le déroulé reste
 * reproductible et que les cotes gardent du sens.
 */

import { simulerMatch, forceEquipe, type AvatarSimule } from '../src/lib/simulation/moteur'
import { calculerCotes, coteDepuisProbabilite, MARGE } from '../src/lib/simulation/cotes'
import type { Stats } from '../src/lib/types'

let echecs = 0

function verifier(intitule: string, condition: boolean, detail = '') {
  const marque = condition ? '  ok  ' : ' ÉCHEC'
  console.log(`[${marque}] ${intitule}${detail ? ` — ${detail}` : ''}`)
  if (!condition) echecs++
}

function joueur(nom: string, stats: Partial<Stats>): AvatarSimule {
  return {
    id: nom.toLowerCase().replace(/\s/g, '-'),
    nom,
    vitesse: 10,
    puissance: 10,
    technique: 10,
    endurance: 10,
    mental: 10,
    ...stats,
  }
}

// Discipline de test : le sprint, très dépendant de la vitesse.
const POIDS_SPRINT: Stats = {
  vitesse: 0.5,
  endurance: 0.25,
  mental: 0.15,
  technique: 0.05,
  puissance: 0.05,
}

const config = (a: AvatarSimule[], b: AvatarSimule[], seed = 123456) => ({
  seed,
  sportSlug: 'sprint-baton',
  poids: POIDS_SPRINT,
  nbActions: 12,
  equipeA: a,
  equipeB: b,
})

console.log('\n=== Moteur de simulation ===\n')

/* -------------------------------------------------------------------------
   1. Déterminisme : même graine, même match
   ------------------------------------------------------------------------- */
{
  const equipeA = [joueur('Alpha', { vitesse: 14 })]
  const equipeB = [joueur('Bravo', { vitesse: 12 })]

  const un = simulerMatch(config(equipeA, equipeB))
  const deux = simulerMatch(config(equipeA, equipeB))

  verifier(
    'même graine → même score',
    un.scoreA === deux.scoreA && un.scoreB === deux.scoreB,
    `${un.scoreA}-${un.scoreB} vs ${deux.scoreA}-${deux.scoreB}`,
  )
  verifier(
    'même graine → même déroulé',
    JSON.stringify(un.evenements) === JSON.stringify(deux.evenements),
    `${un.evenements.length} événements`,
  )

  const autre = simulerMatch(config(equipeA, equipeB, 999))
  verifier(
    'graine différente → déroulé différent',
    JSON.stringify(un.evenements) !== JSON.stringify(autre.evenements),
  )
}

/* -------------------------------------------------------------------------
   2. Cohérence : les points marqués correspondent au score
   ------------------------------------------------------------------------- */
{
  const resultat = simulerMatch(
    config([joueur('Alpha', { vitesse: 16 })], [joueur('Bravo', { vitesse: 8 })]),
  )

  const pointsA = resultat.evenements.filter((e) => e.type === 'point' && e.camp === 'A').length
  const pointsB = resultat.evenements.filter((e) => e.type === 'point' && e.camp === 'B').length

  verifier('score A = points marqués par A', resultat.scoreA === pointsA)
  verifier('score B = points marqués par B', resultat.scoreB === pointsB)
  verifier(
    'le match commence et se termine',
    resultat.evenements[0].type === 'coup_envoi' &&
      resultat.evenements[resultat.evenements.length - 1].type === 'fin',
  )
  verifier(
    'les événements sont numérotés dans l’ordre',
    resultat.evenements.every((e, i) => e.ordre === i),
  )
}

/* -------------------------------------------------------------------------
   3. Les statistiques comptent vraiment
   ------------------------------------------------------------------------- */
{
  const rapide = [joueur('Fusée', { vitesse: 20, endurance: 16, mental: 6, technique: 4, puissance: 4 })]
  const lent = [joueur('Escargot', { vitesse: 2, endurance: 6, mental: 14, technique: 14, puissance: 14 })]

  const forceRapide = forceEquipe(rapide, POIDS_SPRINT)
  const forceLent = forceEquipe(lent, POIDS_SPRINT)

  verifier(
    'un sprinteur est plus fort qu’un lent au sprint',
    forceRapide > forceLent,
    `${forceRapide.toFixed(2)} contre ${forceLent.toFixed(2)}`,
  )

  // Sur 200 matchs, le favori doit largement dominer.
  let victoiresRapide = 0
  for (let i = 0; i < 200; i++) {
    const r = simulerMatch(config(rapide, lent, 1000 + i * 37))
    if (r.scoreA > r.scoreB) victoiresRapide++
  }

  verifier(
    'le favori gagne la grande majorité des matchs',
    victoiresRapide > 150,
    `${victoiresRapide}/200 victoires`,
  )
}

/* -------------------------------------------------------------------------
   4. Les cotes
   ------------------------------------------------------------------------- */
{
  const equilibreA = [joueur('Jumeau A', {})]
  const equilibreB = [joueur('Jumeau B', {})]

  const cotes = calculerCotes(config(equilibreA, equilibreB))

  verifier(
    'deux joueurs identiques → environ 50 %',
    Math.abs(cotes.probaA - 0.5) < 0.04,
    `probaA = ${cotes.probaA}`,
  )
  verifier(
    'cotes équilibrées et supérieures à 1',
    cotes.coteA > 1 && cotes.coteB > 1 && Math.abs(cotes.coteA - cotes.coteB) < 0.2,
    `${cotes.coteA} / ${cotes.coteB}`,
  )

  const fort = [joueur('Champion', { vitesse: 20, endurance: 18, mental: 4, technique: 4, puissance: 4 })]
  const faible = [joueur('Débutant', { vitesse: 3, endurance: 5, mental: 14, technique: 14, puissance: 14 })]
  const desequilibre = calculerCotes(config(fort, faible))

  verifier(
    'le favori a une cote plus basse que l’outsider',
    desequilibre.coteA < desequilibre.coteB,
    `${desequilibre.coteA} contre ${desequilibre.coteB}`,
  )
  verifier(
    'aucune cote ne descend sous 1.01',
    desequilibre.coteA >= 1.01 && desequilibre.coteB >= 1.01,
  )

  // La marge doit rendre la somme des probabilités implicites supérieure à 1.
  const sommeImplicite = 1 / desequilibre.coteA + 1 / desequilibre.coteB
  verifier(
    'la marge de la maison est bien appliquée',
    sommeImplicite > 1,
    `somme des probabilités implicites = ${sommeImplicite.toFixed(3)} (marge ${MARGE})`,
  )

  verifier(
    'une probabilité de 50 % donne une cote de 1.88',
    coteDepuisProbabilite(0.5) === 1.88,
    `obtenu ${coteDepuisProbabilite(0.5)}`,
  )
}

/* -------------------------------------------------------------------------
   5. Formats à plusieurs
   ------------------------------------------------------------------------- */
{
  const quatreContreQuatre = simulerMatch(
    config(
      [1, 2, 3, 4].map((n) => joueur(`A${n}`, { vitesse: 12 })),
      [1, 2, 3, 4].map((n) => joueur(`B${n}`, { vitesse: 12 })),
    ),
  )

  verifier('un 4v4 se joue sans erreur', quatreContreQuatre.evenements.length > 2)
  verifier(
    'le meilleur joueur du match est bien un participant',
    quatreContreQuatre.mvpId === null ||
      [...Array(4)].some((_, i) =>
        [`a${i + 1}`, `b${i + 1}`].includes(quatreContreQuatre.mvpId ?? ''),
      ),
    `mvp = ${quatreContreQuatre.mvpId}`,
  )
}

/* -------------------------------------------------------------------------
   Bilan
   ------------------------------------------------------------------------- */
console.log(
  echecs === 0
    ? '\nTout est bon : le moteur est déterministe et les cotes sont cohérentes.\n'
    : `\n${echecs} vérification(s) en échec.\n`,
)

process.exit(echecs === 0 ? 0 : 1)
