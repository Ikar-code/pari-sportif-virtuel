import { creerAleatoire, type Aleatoire } from './aleatoire'
import { reglagesSport, remplir } from './commentaires'
import { CLES_STATS, type Camp, type Stats } from '@/lib/types'

/**
 * Moteur de simulation.
 *
 * Un match se joue en `nb_actions` occasions. À chaque occasion, les deux camps
 * tirent une « force » = leur note pondérée par la discipline, corrigée par la
 * fatigue, le sang-froid et une part de hasard. Le camp le plus fort marque ;
 * quand l'écart est trop faible, l'occasion ne donne rien.
 *
 * Tout est dérivé de la graine : aucun appel à Math.random(), aucune date.
 * Le même match rejoué donne exactement le même déroulé.
 */

export type AvatarSimule = Stats & {
  id: string
  nom: string
}

export type ConfigMatch = {
  seed: number
  sportSlug: string | null
  poids: Stats
  nbActions: number
  equipeA: AvatarSimule[]
  equipeB: AvatarSimule[]
}

export type EvenementSimule = {
  ordre: number
  minute: number
  type: 'coup_envoi' | 'point' | 'occasion' | 'fait_de_jeu' | 'fin'
  camp: Camp | null
  avatarId: string | null
  texte: string
}

export type ResultatSimulation = {
  scoreA: number
  scoreB: number
  evenements: EvenementSimule[]
  mvpId: string | null
  forceA: number
  forceB: number
}

/** Note d'un avatar sur une discipline : moyenne pondérée de ses 5 stats. */
export function noteAvatar(avatar: Stats, poids: Stats) {
  return CLES_STATS.reduce((somme, cle) => somme + avatar[cle] * (poids[cle] ?? 0), 0)
}

/**
 * Force collective d'un camp.
 * La moyenne compte, mais un joueur au-dessus du lot tire l'équipe vers le haut :
 * c'est ce qui rend les compositions déséquilibrées intéressantes à parier.
 */
export function forceEquipe(equipe: AvatarSimule[], poids: Stats) {
  if (equipe.length === 0) return 1
  const notes = equipe.map((a) => noteAvatar(a, poids))
  const moyenne = notes.reduce((s, n) => s + n, 0) / notes.length
  const meilleure = Math.max(...notes)
  return moyenne + 0.18 * (meilleure - moyenne)
}

/** Endurance moyenne d'un camp, ramenée sur [0, 1]. */
function enduranceMoyenne(equipe: AvatarSimule[]) {
  if (equipe.length === 0) return 0.5
  return equipe.reduce((s, a) => s + a.endurance, 0) / equipe.length / 20
}

function mentalMoyen(equipe: AvatarSimule[]) {
  if (equipe.length === 0) return 0.5
  return equipe.reduce((s, a) => s + a.mental, 0) / equipe.length / 20
}

/**
 * Qui marque, dans le camp qui vient de gagner l'occasion ?
 * Pondéré par la note du joueur sur la discipline : le meilleur marque plus
 * souvent, sans jamais monopoliser.
 */
function tirerButeur(equipe: AvatarSimule[], poids: Stats, rng: Aleatoire) {
  const poidsJoueurs = equipe.map((a) => Math.pow(noteAvatar(a, poids), 1.6))
  return equipe[rng.indexPondere(poidsJoueurs)]
}

export function simulerMatch(config: ConfigMatch): ResultatSimulation {
  const { seed, sportSlug, poids, nbActions, equipeA, equipeB } = config
  const rng = creerAleatoire(seed)
  const reglages = reglagesSport(sportSlug)

  const forceA = forceEquipe(equipeA, poids)
  const forceB = forceEquipe(equipeB, poids)

  const enduranceA = enduranceMoyenne(equipeA)
  const enduranceB = enduranceMoyenne(equipeB)
  const mentalA = mentalMoyen(equipeA)
  const mentalB = mentalMoyen(equipeB)

  const evenements: EvenementSimule[] = []
  const pointsParJoueur = new Map<string, number>()

  let scoreA = 0
  let scoreB = 0
  let ordre = 0

  const ajouter = (e: Omit<EvenementSimule, 'ordre'>) => {
    evenements.push({ ...e, ordre: ordre++ })
  }

  ajouter({
    minute: 0,
    type: 'coup_envoi',
    camp: null,
    avatarId: null,
    texte: 'Coup d’envoi : les bâtons sont en place.',
  })

  for (let i = 0; i < nbActions; i++) {
    const avancement = (i + 1) / nbActions
    const minute = Math.max(1, Math.round(avancement * reglages.duree))

    // Fatigue : jusqu'à 25 % de perte en fin de match, amortie par l'endurance.
    const fatigueA = 1 - avancement * 0.25 * (1 - enduranceA)
    const fatigueB = 1 - avancement * 0.25 * (1 - enduranceB)

    // Sang-froid : le mental ne compte que dans le dernier quart.
    const clutch = avancement > 0.75 ? 1 : 0
    const sangFroidA = 1 + clutch * 0.12 * (mentalA - 0.5)
    const sangFroidB = 1 + clutch * 0.12 * (mentalB - 0.5)

    const tirageA = forceA * fatigueA * sangFroidA * (0.65 + 0.7 * rng.suivant())
    const tirageB = forceB * fatigueB * sangFroidB * (0.65 + 0.7 * rng.suivant())

    const ecart = Math.abs(tirageA - tirageB)
    const seuil = (forceA + forceB) / 2 * 0.06

    if (ecart < seuil) {
      // Trop serré : occasion sans conséquence, ou simple fait de jeu.
      const gagnantVisuel: Camp = tirageA >= tirageB ? 'A' : 'B'
      const equipe = gagnantVisuel === 'A' ? equipeA : equipeB
      const joueur = rng.choix(equipe)
      const estFait = rng.suivant() < 0.35

      ajouter({
        minute,
        type: estFait ? 'fait_de_jeu' : 'occasion',
        camp: gagnantVisuel,
        avatarId: joueur.id,
        texte: remplir(rng.choix(estFait ? reglages.fait : reglages.occasion), {
          joueur: joueur.nom,
        }),
      })
      continue
    }

    const camp: Camp = tirageA > tirageB ? 'A' : 'B'
    const equipe = camp === 'A' ? equipeA : equipeB
    const buteur = tirerButeur(equipe, poids, rng)

    if (camp === 'A') scoreA++
    else scoreB++
    pointsParJoueur.set(buteur.id, (pointsParJoueur.get(buteur.id) ?? 0) + 1)

    ajouter({
      minute,
      type: 'point',
      camp,
      avatarId: buteur.id,
      texte: remplir(rng.choix(reglages.point), { joueur: buteur.nom }),
    })
  }

  // Meilleur joueur : celui qui a le plus marqué, départagé par sa note.
  let mvpId: string | null = null
  let meilleurScore = -1
  for (const avatar of [...equipeA, ...equipeB]) {
    const points = pointsParJoueur.get(avatar.id) ?? 0
    const note = points * 100 + noteAvatar(avatar, poids)
    if (points > 0 && note > meilleurScore) {
      meilleurScore = note
      mvpId = avatar.id
    }
  }

  ajouter({
    minute: reglages.duree,
    type: 'fin',
    camp: null,
    avatarId: null,
    texte:
      scoreA === scoreB
        ? `Fin du match : ${scoreA} partout, personne ne se départage.`
        : `Fin du match : ${scoreA} — ${scoreB}, victoire du camp ${scoreA > scoreB ? 'A' : 'B'}.`,
  })

  return { scoreA, scoreB, evenements, mvpId, forceA, forceB }
}
