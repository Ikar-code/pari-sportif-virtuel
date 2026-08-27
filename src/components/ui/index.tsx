import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

/* ==========================================================================
   Boutons
   ========================================================================== */

type VarianteBouton = 'neon' | 'cyan' | 'jeton' | 'contour' | 'fantome' | 'danger'
type TailleBouton = 'sm' | 'md' | 'lg' | 'icone'

const BASE_BOUTON =
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap ' +
  'transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ' +
  'focus-visible:ring-offset-2 focus-visible:ring-offset-background ' +
  'disabled:pointer-events-none disabled:opacity-50 active:translate-y-px'

const VARIANTES: Record<VarianteBouton, string> = {
  neon: 'bg-neon text-neon-foreground shadow-sm hover:brightness-110',
  cyan: 'bg-cyan text-cyan-foreground shadow-sm hover:brightness-110',
  jeton: 'bg-jeton text-jeton-foreground shadow-sm hover:brightness-105',
  contour: 'border border-border bg-card hover:bg-muted',
  fantome: 'hover:bg-muted',
  danger: 'bg-danger text-white shadow-sm hover:brightness-110',
}

const TAILLES: Record<TailleBouton, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
  icone: 'h-9 w-9',
}

export function classesBouton(variante: VarianteBouton = 'neon', taille: TailleBouton = 'md') {
  return cn(BASE_BOUTON, VARIANTES[variante], TAILLES[taille])
}

export function Bouton({
  variante = 'neon',
  taille = 'md',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: VarianteBouton
  taille?: TailleBouton
}) {
  return <button className={cn(classesBouton(variante, taille), className)} {...props} />
}

export function LienBouton({
  variante = 'neon',
  taille = 'md',
  className,
  ...props
}: React.ComponentProps<typeof Link> & { variante?: VarianteBouton; taille?: TailleBouton }) {
  return <Link className={cn(classesBouton(variante, taille), className)} {...props} />
}

/* ==========================================================================
   Cartes
   ========================================================================== */

export function Carte({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-lg border border-border bg-card shadow-carte', className)}
      {...props}
    />
  )
}

export function TitreCarte({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('font-display text-lg font-semibold leading-tight', className)} {...props} />
  )
}

/* ==========================================================================
   Badges
   ========================================================================== */

type TonBadge = 'neutre' | 'neon' | 'cyan' | 'jeton' | 'succes' | 'alerte' | 'danger'

const TONS: Record<TonBadge, string> = {
  neutre: 'bg-muted text-muted-foreground',
  neon: 'bg-neon/10 text-neon',
  cyan: 'bg-cyan/10 text-cyan',
  jeton: 'bg-jeton/15 text-jeton',
  succes: 'bg-succes/10 text-succes',
  alerte: 'bg-alerte/15 text-alerte',
  danger: 'bg-danger/10 text-danger',
}

export function Badge({
  ton = 'neutre',
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { ton?: TonBadge }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        TONS[ton],
        className,
      )}
      {...props}
    />
  )
}

/* ==========================================================================
   Formulaires
   ========================================================================== */

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('text-sm font-medium text-foreground', className)} {...props} />
}

const CHAMP =
  'w-full rounded-lg border border-input bg-card px-3 py-2 text-sm shadow-sm ' +
  'placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-ring focus-visible:border-ring disabled:opacity-50'

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(CHAMP, 'h-10', className)} {...props} />
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(CHAMP, 'min-h-24 resize-y', className)} {...props} />
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(CHAMP, 'h-10 pr-8', className)} {...props} />
}

export function ChampFormulaire({
  label,
  htmlFor,
  aide,
  obligatoire,
  className,
  children,
}: {
  label: string
  htmlFor?: string
  aide?: string
  obligatoire?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {obligatoire && <span className="ml-0.5 text-neon">*</span>}
      </Label>
      {children}
      {aide && <p className="text-xs text-muted-foreground">{aide}</p>}
    </div>
  )
}

/* ==========================================================================
   Tableau
   ========================================================================== */

export function Tableau({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  )
}

export function Th({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground',
        className,
      )}
      {...props}
    />
  )
}

export function Td({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('border-t border-border px-3 py-3 align-middle', className)} {...props} />
}

/* ==========================================================================
   Divers
   ========================================================================== */

export function EtatVide({
  icone,
  titre,
  texte,
  action,
}: {
  icone?: React.ReactNode
  titre: string
  texte?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-muted/40 px-6 py-14 text-center">
      {icone && <div className="text-muted-foreground">{icone}</div>}
      <div className="space-y-1">
        <p className="font-display text-base font-semibold">{titre}</p>
        {texte && <p className="mx-auto max-w-sm text-sm text-muted-foreground">{texte}</p>}
      </div>
      {action}
    </div>
  )
}

export function Alerte({
  ton = 'neutre',
  children,
}: {
  ton?: 'neutre' | 'succes' | 'danger' | 'alerte'
  children: React.ReactNode
}) {
  const styles = {
    neutre: 'border-border bg-muted text-foreground',
    succes: 'border-succes/30 bg-succes/10 text-succes',
    danger: 'border-danger/30 bg-danger/10 text-danger',
    alerte: 'border-alerte/30 bg-alerte/10 text-alerte',
  }[ton]

  return (
    <div className={cn('rounded-lg border px-4 py-3 text-sm', styles)} role="status">
      {children}
    </div>
  )
}

export function Separateur({ className }: { className?: string }) {
  return <hr className={cn('border-t border-border', className)} />
}

/** Barre de progression d'une statistique, sur 20. */
export function Jauge({
  valeur,
  max = 20,
  couleur,
  className,
}: {
  valeur: number
  max?: number
  couleur?: string
  className?: string
}) {
  const ratio = Math.max(0, Math.min(1, valeur / max))
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-muted', className)}>
      <div
        className="h-full rounded-full transition-[width]"
        style={{ width: `${ratio * 100}%`, background: couleur ?? 'hsl(var(--neon))' }}
      />
    </div>
  )
}
