import type {
  BlockId,
  Currency,
  ExpenseItem,
  FinanceState,
  FundingSource,
  Holding,
  HoldingKind,
  IncomeItem,
  IncomeSource,
  Month,
} from '../types/finance.ts'
import { isMonthId } from './months.ts'

/**
 * Capa de persistencia. Hoy: localStorage. Para migrar a Supabase/SQLite basta
 * con otra implementación de `FinanceRepository` (mismo shape de `FinanceState`;
 * cada Month/ExpenseItem/IncomeItem/Holding mapea 1:1 a una tabla).
 */
export interface FinanceRepository {
  load(): FinanceState | null
  save(state: FinanceState): void
}

const STORAGE_KEY = 'finanzas-familia:v1'

export const localStorageRepository: FinanceRepository = {
  load() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      return raw ? parseState(JSON.parse(raw)) : null
    } catch (err) {
      console.error('No se pudo leer el estado guardado', err)
      return null
    }
  },
  save(state) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (err) {
      console.error('No se pudo guardar el estado', err)
    }
  },
}

// ---------------------------------------------------------------------------
// Validación (backups importados y datos guardados)
// ---------------------------------------------------------------------------

export class InvalidDataError extends Error {}

const CURRENCIES: Currency[] = ['USD', 'EUR', 'ARS']
const BLOCKS: BlockId[] = ['ES', 'AR', 'FONDOS']
const FUNDING: FundingSource[] = ['Sweed', 'Harry', 'Nexup', 'Galicia', 'Wise']
const INCOME: IncomeSource[] = ['Sweed', 'Harry', 'Nexup', 'Otro']
const KINDS: HoldingKind[] = ['cripto', 'accion', 'liquidez']

type Obj = Record<string, unknown>

function fail(path: string, msg: string): never {
  throw new InvalidDataError(`${path}: ${msg}`)
}
function obj(v: unknown, path: string): Obj {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) fail(path, 'se esperaba un objeto')
  return v as Obj
}
function arr(v: unknown, path: string): unknown[] {
  if (!Array.isArray(v)) fail(path, 'se esperaba una lista')
  return v
}
function str(v: unknown, path: string): string {
  if (typeof v !== 'string') fail(path, 'se esperaba texto')
  return v
}
function cents(v: unknown, path: string): number {
  if (typeof v !== 'number' || !Number.isSafeInteger(v)) fail(path, 'se esperaba un entero en centavos')
  return v
}
function positive(v: unknown, path: string): number {
  if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) fail(path, 'se esperaba un número > 0')
  return v
}
function oneOf<T extends string>(v: unknown, options: readonly T[], path: string): T {
  if (!options.includes(v as T)) fail(path, `valor inválido "${String(v)}" (opciones: ${options.join(', ')})`)
  return v as T
}

export function parseExpense(v: unknown, path: string): ExpenseItem {
  const o = obj(v, path)
  return {
    id: str(o.id, `${path}.id`),
    block: oneOf(o.block, BLOCKS, `${path}.block`),
    name: str(o.name, `${path}.name`),
    category: str(o.category, `${path}.category`),
    currency: oneOf(o.currency, CURRENCIES, `${path}.currency`),
    budget: cents(o.budget, `${path}.budget`),
    actual: cents(o.actual, `${path}.actual`),
    source: oneOf(o.source, FUNDING, `${path}.source`),
    fixed: Boolean(o.fixed),
    isAdvance: Boolean(o.isAdvance),
    ...(typeof o.notes === 'string' ? { notes: o.notes } : {}),
  }
}

function parseIncome(v: unknown, path: string): IncomeItem {
  const o = obj(v, path)
  return {
    id: str(o.id, `${path}.id`),
    source: oneOf(o.source, INCOME, `${path}.source`),
    label: str(o.label, `${path}.label`),
    currency: oneOf(o.currency, CURRENCIES, `${path}.currency`),
    amount: cents(o.amount, `${path}.amount`),
    received: Boolean(o.received),
  }
}

function parseMonth(v: unknown, path: string): Month {
  const o = obj(v, path)
  const id = str(o.id, `${path}.id`)
  if (!isMonthId(id)) fail(`${path}.id`, `"${id}" no tiene formato YYYY-MM`)
  const rates = obj(o.rates, `${path}.rates`)
  return {
    id,
    rates: {
      usdArs: positive(rates.usdArs, `${path}.rates.usdArs`),
      usdEur: positive(rates.usdEur, `${path}.rates.usdEur`),
    },
    locked: Boolean(o.locked),
    incomes: arr(o.incomes, `${path}.incomes`).map((x, i) => parseIncome(x, `${path}.incomes[${i}]`)),
    expenses: arr(o.expenses, `${path}.expenses`).map((x, i) => parseExpense(x, `${path}.expenses[${i}]`)),
  }
}

function parseHolding(v: unknown, path: string): Holding {
  const o = obj(v, path)
  const quantity = typeof o.quantity === 'number' && Number.isFinite(o.quantity) ? o.quantity : 0
  return {
    id: str(o.id, `${path}.id`),
    platform: str(o.platform, `${path}.platform`),
    asset: str(o.asset, `${path}.asset`),
    kind: oneOf(o.kind, KINDS, `${path}.kind`),
    quantity,
    value: cents(o.value, `${path}.value`),
    currency: oneOf(o.currency, CURRENCIES, `${path}.currency`),
  }
}

/** Valida un estado completo. Lanza InvalidDataError con la ruta del problema. */
export function parseState(v: unknown): FinanceState {
  const o = obj(v, 'backup')
  if (o.version !== 1) fail('backup.version', `versión no soportada: ${String(o.version)}`)
  const months = arr(o.months, 'backup.months').map((m, i) => parseMonth(m, `backup.months[${i}]`))
  if (months.length === 0) fail('backup.months', 'debe haber al menos un mes')
  const ids = new Set(months.map((m) => m.id))
  if (ids.size !== months.length) fail('backup.months', 'hay meses duplicados')
  const currentMonthId = typeof o.currentMonthId === 'string' && ids.has(o.currentMonthId)
    ? o.currentMonthId
    : months[months.length - 1].id
  return {
    version: 1,
    months,
    currentMonthId,
    displayCurrency: o.displayCurrency === 'USD' ? 'USD' : 'EUR',
    holdings: arr(o.holdings ?? [], 'backup.holdings').map((h, i) => parseHolding(h, `backup.holdings[${i}]`)),
    portfolioUpdatedAt: typeof o.portfolioUpdatedAt === 'string' ? o.portfolioUpdatedAt : null,
  }
}
