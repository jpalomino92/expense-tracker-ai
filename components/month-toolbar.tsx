'use client'

import { useState } from 'react'
import { CopyPlus, Lock, LockOpen, X } from 'lucide-react'
import { useFinance } from '@/context/finance-context'
import { formatRate, parseRate } from '@/lib/money'
import { latestMonth, monthLabel } from '@/lib/months'
import { Button, inputClass, cn } from '@/components/ui/primitives'
import type { MonthRates } from '@/types/finance'

function RateField({
  label,
  value,
  onCommit,
  disabled,
}: {
  label: string
  value: number
  onCommit: (v: number) => void
  disabled: boolean
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const [invalid, setInvalid] = useState(false)
  const commit = () => {
    if (draft === null) return
    const v = parseRate(draft)
    setInvalid(v === null)
    if (v !== null && v !== value) onCommit(v)
    setDraft(null)
  }
  return (
    <label className="flex items-center gap-2 text-xs text-muted">
      <span className="whitespace-nowrap">{label}</span>
      <input
        inputMode="decimal"
        disabled={disabled}
        value={draft ?? formatRate(value, 6)}
        aria-invalid={invalid}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        className={cn(inputClass, 'tabular h-8 w-24 text-right', invalid && 'outline-2 outline-bad')}
      />
    </label>
  )
}

/** Tipos de cambio del mes + cerrar/abrir mes + clonar. */
export function MonthToolbar() {
  const { state, dispatch, currentMonth, nextCloneId } = useFinance()
  const [cloneOpen, setCloneOpen] = useState(false)
  const [onlyFixed, setOnlyFixed] = useState(true)
  const { rates, locked, id } = currentMonth
  const source = latestMonth(state.months)!

  const setRates = (patch: Partial<MonthRates>) =>
    dispatch({ type: 'setRates', monthId: id, rates: { ...rates, ...patch } })

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-border bg-surface p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">Tipos de cambio · {monthLabel(id)}</span>
        <RateField label="1 USD = ARS" value={rates.usdArs} disabled={locked} onCommit={(usdArs) => setRates({ usdArs })} />
        <RateField label="1 USD = EUR" value={rates.usdEur} disabled={locked} onCommit={(usdEur) => setRates({ usdEur })} />
        <span className="tabular text-xs text-muted">1 EUR = {formatRate(1 / rates.usdEur)} USD</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => dispatch({ type: 'setLocked', monthId: id, locked: !locked })}
          title={locked ? 'Reabrir el mes para editar' : 'Cerrar el mes: bloquea ediciones'}
        >
          {locked ? <LockOpen className="size-3.5" /> : <Lock className="size-3.5" />}
          {locked ? 'Reabrir mes' : 'Cerrar mes'}
        </Button>
        <Button size="sm" variant="primary" onClick={() => setCloneOpen(true)}>
          <CopyPlus className="size-3.5" />
          Clonar mes anterior
        </Button>
      </div>

      {cloneOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="clone-title"
          className="fixed inset-0 z-50 grid place-items-end bg-black/40 p-4 sm:place-items-center"
          onClick={(e) => e.target === e.currentTarget && setCloneOpen(false)}
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-xl">
            <div className="mb-3 flex items-start justify-between">
              <h2 id="clone-title" className="text-base font-semibold">
                Iniciar {monthLabel(nextCloneId)}
              </h2>
              <button type="button" aria-label="Cerrar" onClick={() => setCloneOpen(false)} className="text-muted hover:text-ink">
                <X className="size-4" />
              </button>
            </div>
            <p className="mb-4 text-sm text-ink-2">
              Copia <strong>{monthLabel(source.id)}</strong>: ítems con su presupuesto, Real en 0, ingresos sin marcar como
              recibidos y los mismos tipos de cambio (ajustalos después).
            </p>
            <label className="mb-5 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={onlyFixed} onChange={(e) => setOnlyFixed(e.target.checked)} className="size-4 accent-[var(--accent)]" />
              Solo ítems fijos ({source.expenses.filter((e) => e.fixed).length} de {source.expenses.length})
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setCloneOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  dispatch({ type: 'cloneLatest', onlyFixed })
                  setCloneOpen(false)
                }}
              >
                Crear {monthLabel(nextCloneId)}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
