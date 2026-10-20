import type { Month } from '../types/finance.ts'

export const newId = (): string => globalThis.crypto.randomUUID()

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export function isMonthId(id: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(id)
}

/** "2026-10" → "Octubre 2026" */
export function monthLabel(id: string, short = false): string {
  const [y, m] = id.split('-').map(Number)
  const name = MONTH_NAMES[m - 1] ?? id
  return short ? `${name.slice(0, 3)} ${String(y).slice(2)}` : `${name} ${y}`
}

/** "2026-12" → "2027-01" */
export function nextMonthId(id: string): string {
  const [y, m] = id.split('-').map(Number)
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`
}

export const sortMonths = (months: Month[]) => [...months].sort((a, b) => a.id.localeCompare(b.id))

export const latestMonth = (months: Month[]): Month | undefined => sortMonths(months).at(-1)

export interface CloneOptions {
  /** true: solo ítems marcados como fijos. false: todos los ítems. */
  onlyFixed: boolean
}

/**
 * Crea el mes siguiente a `source`: copia tipos de cambio, ingresos (sin
 * marcar como recibidos) y gastos con Real = 0 y el mismo Presupuestado.
 */
export function cloneMonth(source: Month, { onlyFixed }: CloneOptions): Month {
  return {
    id: nextMonthId(source.id),
    rates: { ...source.rates },
    locked: false,
    incomes: source.incomes.map((i) => ({ ...i, id: newId(), received: false })),
    expenses: source.expenses
      .filter((e) => !onlyFixed || e.fixed)
      .map((e) => ({ ...e, id: newId(), actual: 0 })),
  }
}
