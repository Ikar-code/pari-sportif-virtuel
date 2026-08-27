import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { CLES_STATS, type CleStat, type Rarete, type StatutMatch, type StatutPari, type Stats, type TypeTransaction } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/* --------------------------------------------------------------------------
   Le nom du jeu vit ici : changez-le et il suit partout.
   -------------------------------------------------------------------------- */
export const NOM_DU_JEU = 'Bâton Arena'
export const NOM_MONNAIE = 'jetons'

/* --------------------------------------------------------------------------
   Nombres et monnaie
   -------------------------------------------------------------------------- */

export function formatJetons(montant: number, options?: { signe?: boolean }) {
  const valeur = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: Number.isInteger(montant) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(montant))

  if (!options?.signe) return valeur
  return `${montant < 0 ? '−' : '+'}${valeur}`
}

export function formatCote(cote: number) {
  return cote.toFixed(2)
}

export function formatPourcent(ratio: number, decimales = 0) {
  return `${(ratio * 100).toFixed(decimales)} %`
}

/* --------------------------------------------------------------------------
   Dates
   -------------------------------------------------------------------------- */

export function formatDateHeure(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function formatHeure(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(
    new Date(iso),
  )
}

export function dateRelative(iso: string) {
  const diffMs = new Date(iso).getTime() - Date.now()
  const rtf = new Intl.RelativeTimeFormat('fr-FR', { numeric: 'auto' })
  const secondes = Math.round(diffMs / 1000)

  if (Math.abs(secondes) < 60) return rtf.format(secondes, 'second')
  const minutes = Math.round(secondes / 60)
  if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute')
  const heures = Math.round(minutes / 60)
  if (Math.abs(heures) < 24) return rtf.format(heures, 'hour')
  return rtf.format(Math.round(heures / 24), 'day')
}

/** Compte à rebours "01:23" jusqu'à une date. Négatif => "00:00". */
export function compteARebours(iso: string) {
  const restant = Math.max(0, new Date(iso).getTime() - Date.now())
  const totalSecondes = Math.floor(restant / 1000)
  const m = Math.floor(totalSecondes / 60)
  const s = totalSecondes % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/* --------------------------------------------------------------------------
   Libellés
   -------------------------------------------------------------------------- */

export const LIBELLE_STAT: Record<CleStat, string> = {
  vitesse: 'Vitesse',
  puissance: 'Puissance',
  technique: 'Technique',
  endurance: 'Endurance',
  mental: 'Mental',
}

export const LIBELLE_STATUT_MATCH: Record<StatutMatch, string> = {
  a_venir: 'Paris ouverts',
  en_cours: 'En cours',
  termine: 'Terminé',
  annule: 'Annulé',
}

export const LIBELLE_STATUT_PARI: Record<StatutPari, string> = {
  en_attente: 'En attente',
  gagne: 'Gagné',
  perdu: 'Perdu',
  rembourse: 'Remboursé',
}

export const LIBELLE_RARETE: Record<Rarete, string> = {
  commun: 'Commun',
  rare: 'Rare',
  epique: 'Épique',
  legendaire: 'Légendaire',
}

export const COULEUR_RARETE: Record<Rarete, string> = {
  commun: '#94A3B8',
  rare: '#38BDF8',
  epique: '#A855F7',
  legendaire: '#FFB020',
}

export const LIBELLE_TRANSACTION: Record<TypeTransaction, string> = {
  bonus_inscription: 'Capital de départ',
  bonus_quotidien: 'Bonus quotidien',
  mise: 'Mise',
  gain: 'Gain de pari',
  remboursement: 'Remboursement',
  achat_boutique: 'Achat boutique',
  prime_victoire: 'Prime de victoire',
}

export const LIBELLE_FORMAT: Record<number, string> = {
  1: '1 contre 1',
  2: '2 contre 2',
  4: '4 contre 4',
}

/* --------------------------------------------------------------------------
   Statistiques
   -------------------------------------------------------------------------- */

export const STAT_MIN = 1
export const STAT_MAX = 20

/** Budget de points disponible à un niveau donné — miroir de la fonction SQL. */
export function budgetStats(niveau: number) {
  return 50 + (Math.max(niveau, 1) - 1) * 3
}

export function totalStats(stats: Stats) {
  return CLES_STATS.reduce((somme, cle) => somme + stats[cle], 0)
}

/** Moyenne pondérée des stats pour une discipline donnée. */
export function noteSport(stats: Stats, poids: Stats) {
  return CLES_STATS.reduce((somme, cle) => somme + stats[cle] * (poids[cle] ?? 0), 0)
}

/* --------------------------------------------------------------------------
   FormData
   -------------------------------------------------------------------------- */

export function champ(formData: FormData, nom: string) {
  const v = formData.get(nom)
  return typeof v === 'string' ? v.trim() : ''
}

export function champOuNull(formData: FormData, nom: string) {
  return champ(formData, nom) || null
}

export function champNombre(formData: FormData, nom: string) {
  const v = champ(formData, nom)
  if (v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/* --------------------------------------------------------------------------
   Divers
   -------------------------------------------------------------------------- */

export function initiales(nom: string) {
  return nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((m) => m[0]?.toUpperCase() ?? '')
    .join('')
}

export function borner(valeur: number, min: number, max: number) {
  return Math.min(max, Math.max(min, valeur))
}
