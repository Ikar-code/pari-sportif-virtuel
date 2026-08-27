import { Badge } from '@/components/ui'
import { LIBELLE_STATUT_MATCH, LIBELLE_STATUT_PARI } from '@/lib/utils'
import type { StatutMatch, StatutPari } from '@/lib/types'

const TON_MATCH = {
  a_venir: 'succes',
  en_cours: 'neon',
  termine: 'neutre',
  annule: 'danger',
} as const

export function StatutMatchBadge({ statut }: { statut: StatutMatch }) {
  return (
    <Badge ton={TON_MATCH[statut]}>
      {statut === 'en_cours' && (
        <span className="h-1.5 w-1.5 rounded-full bg-neon animate-pulse-dot" aria-hidden />
      )}
      {LIBELLE_STATUT_MATCH[statut]}
    </Badge>
  )
}

const TON_PARI = {
  en_attente: 'alerte',
  gagne: 'succes',
  perdu: 'danger',
  rembourse: 'neutre',
} as const

export function StatutPariBadge({ statut }: { statut: StatutPari }) {
  return <Badge ton={TON_PARI[statut]}>{LIBELLE_STATUT_PARI[statut]}</Badge>
}
