'use client'

import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { CheckCircle2, CircleDashed, CircleDot } from 'lucide-react'
import type { Currency, ItemStatus } from '@/types/finance'
import { centsToInput, formatMoney, parseToCents } from '@/lib/money'

export const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ')

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section className={cn('rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5', className)}>
      {children}
    </section>
  )
}

export function CardTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="text-sm font-semibold text-ink-2">{children}</h2>
      {action}
    </div>
  )
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        'disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'h-8 px-2.5 text-xs' : 'h-10 px-3.5 text-sm',
        variant === 'primary' && 'bg-accent text-accent-ink hover:brightness-110',
        variant === 'secondary' && 'border border-border bg-surface-2 text-ink hover:bg-grid',
        variant === 'ghost' && 'text-ink-2 hover:bg-surface-2',
        variant === 'danger' && 'text-bad hover:bg-surface-2',
        className,
      )}
      {...props}
    />
  )
}

/**
 * Botón de papelera con confirmación en dos clics: el primero lo arma (se pone
 * rojo), el segundo elimina. Se desarma al perder el foco.
 */
export function DeleteButton({ label, onConfirm, disabled, children, className }: {
  label: string; onConfirm: () => void; disabled?: boolean; children: ReactNode; className?: string
}) {
  const [armed, setArmed] = useState(false)
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={armed ? `Confirmar: ${label}` : label}
      title={armed ? 'Tocá de nuevo para eliminar' : label}
      onClick={() => (armed ? onConfirm() : setArmed(true))}
      onBlur={() => setArmed(false)}
      className={cn(
        'disabled:opacity-40',
        armed ? 'bg-bad text-white hover:brightness-110' : 'text-muted hover:text-bad',
        className,
      )}
    >
      {children}
    </button>
  )
}

/** Control segmentado (toggle de 2-4 opciones). */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  size = 'md',
}: {
  value: T
  options: Array<{ value: T; label: ReactNode }>
  onChange: (v: T) => void
  label: string
  size?: 'sm' | 'md'
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg border border-border bg-surface-2 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-md px-2.5 font-medium transition-colors',
            size === 'sm' ? 'h-7 text-xs' : 'h-8 text-sm',
            value === o.value ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export const inputClass =
  'h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-sm text-ink placeholder:text-muted ' +
  'focus:outline-2 focus:outline-accent disabled:opacity-60'

export function Select<T extends string>({
  value,
  options,
  onChange,
  label,
  disabled,
  className,
}: {
  value: T
  options: Array<{ value: T; label: string }> | readonly T[]
  onChange: (v: T) => void
  label: string
  disabled?: boolean
  className?: string
}) {
  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o))
  return (
    <select
      aria-label={label}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as T)}
      className={cn(inputClass, 'pr-7', className)}
    >
      {opts.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

/**
 * Input de dinero: acepta "1.267,50", "1267.5", etc. Confirma al salir o con
 * Enter; si el texto no es un número válido, vuelve al valor anterior.
 */
export function MoneyInput({
  cents,
  currency,
  onCommit,
  label,
  disabled,
  className,
}: {
  cents: number
  currency: Currency
  onCommit: (cents: number) => void
  label: string
  disabled?: boolean
  className?: string
}) {
  const [draft, setDraft] = useState(centsToInput(cents))
  const [invalid, setInvalid] = useState(false)
  useEffect(() => setDraft(centsToInput(cents)), [cents])

  const commit = () => {
    const parsed = parseToCents(draft)
    if (parsed === null || parsed < 0) {
      setInvalid(true)
      setDraft(centsToInput(cents))
      return
    }
    setInvalid(false)
    if (parsed !== cents) onCommit(parsed)
    else setDraft(centsToInput(cents))
  }

  return (
    <div className={cn('relative', className)}>
      <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-xs text-muted">
        {currency === 'EUR' ? '€' : currency === 'USD' ? 'US$' : '$'}
      </span>
      <input
        inputMode="decimal"
        aria-label={label}
        aria-invalid={invalid}
        disabled={disabled}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => e.target.select()}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        className={cn(inputClass, 'tabular text-right', currency === 'USD' ? 'pl-9' : 'pl-6', invalid && 'outline-2 outline-bad')}
      />
    </div>
  )
}

export function Money({
  cents,
  currency,
  className,
  signed,
  tone,
}: {
  cents: number
  currency: Currency
  className?: string
  signed?: boolean
  /** Colorea según signo (verde/rojo) — siempre acompañado del signo. */
  tone?: boolean
}) {
  return (
    <span
      className={cn(
        'tabular whitespace-nowrap',
        tone && (cents < 0 ? 'text-bad' : cents > 0 ? 'text-good' : undefined),
        className,
      )}
    >
      {formatMoney(cents, currency, { signed })}
    </span>
  )
}

const STATUS_META: Record<ItemStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  pagado: { label: 'Pagado', icon: CheckCircle2, className: 'text-good' },
  parcial: { label: 'Parcial', icon: CircleDot, className: 'text-ink-2' },
  pendiente: { label: 'Pendiente', icon: CircleDashed, className: 'text-muted' },
}

export function StatusBadge({ status }: { status: ItemStatus }) {
  const { label, icon: Icon, className } = STATUS_META[status]
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium', className)}>
      <Icon
        aria-hidden
        className={cn('size-3.5', status === 'parcial' && 'text-warn-mark')}
      />
      {label}
    </span>
  )
}

export function ProgressBar({ value, max, color = 'var(--accent)', label }: { value: number; max: number; color?: string; label: string }) {
  const pct = max > 0 ? Math.min(value / max, 1) * 100 : 0
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-2 w-full overflow-hidden rounded-full bg-surface-2"
    >
      <div className="h-full rounded-full transition-[width]" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">{children}</p>
}
