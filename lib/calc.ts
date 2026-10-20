import type {
  BlockId,
  Currency,
  ExpenseItem,
  FundingSource,
  Holding,
  IncomeItem,
  ItemStatus,
  Month,
  MonthRates,
} from '../types/finance.ts'
import { addTo, consolidate, convert, zeroTotals, type CurrencyTotals } from './money.ts'

export const BLOCKS: BlockId[] = ['ES', 'AR', 'FONDOS']
export const FUNDING_SOURCES: FundingSource[] = ['Sweed', 'Harry', 'Nexup', 'Galicia', 'Wise']

// ---------------------------------------------------------------------------
// Ítems
// ---------------------------------------------------------------------------

/** El estado se DERIVA de los montos: imposible que diga "Pagado" con Real = 0. */
export function itemStatus(item: Pick<ExpenseItem, 'budget' | 'actual'>): ItemStatus {
  if (item.actual <= 0) return item.budget <= 0 ? 'pagado' : 'pendiente'
  return item.actual >= item.budget ? 'pagado' : 'parcial'
}

/** Lo que falta pagar del ítem (nunca negativo). */
export const pendingOf = (i: ExpenseItem) => Math.max(i.budget - i.actual, 0)

/** Compromiso real del ítem: lo presupuestado, o lo pagado si se pasó. */
export const committedOf = (i: ExpenseItem) => Math.max(i.budget, i.actual)

function totalsBy<T>(
  items: T[],
  currencyOf: (i: T) => Currency,
  amountOf: (i: T) => number,
): CurrencyTotals {
  return items.reduce((t, i) => addTo(t, currencyOf(i), amountOf(i)), zeroTotals())
}

export const expenseTotals = (items: ExpenseItem[], amountOf: (i: ExpenseItem) => number) =>
  totalsBy(items, (i) => i.currency, amountOf)

export const incomeTotals = (items: IncomeItem[]) =>
  totalsBy(items, (i) => i.currency, (i) => i.amount)

// ---------------------------------------------------------------------------
// Resumen mensual
// ---------------------------------------------------------------------------

export interface Figures {
  budget: number
  actual: number
  pending: number
  committed: number
}

export interface BlockSummary extends Figures {
  /** Totales en moneda nativa (para mostrar el bloque AR en ARS, etc.). */
  native: { budget: CurrencyTotals; actual: CurrencyTotals; pending: CurrencyTotals }
  itemCount: number
  paidCount: number
}

export interface MonthSummary extends Figures {
  currency: Currency
  income: number
  incomeReceived: number
  /** income − committed: superávit (+) o déficit (−). */
  balance: number
  /** Adelantos Sweed (compromiso) — caja que sale pero no es consumo. */
  advances: number
  /** Gasto de consumo real pagado, excluyendo adelantos. */
  consumptionActual: number
  byBlock: Record<BlockId, BlockSummary>
}

function figures(items: ExpenseItem[], to: Currency, rates: MonthRates): Figures {
  return {
    budget: consolidate(expenseTotals(items, (i) => i.budget), to, rates),
    actual: consolidate(expenseTotals(items, (i) => i.actual), to, rates),
    pending: consolidate(expenseTotals(items, pendingOf), to, rates),
    committed: consolidate(expenseTotals(items, committedOf), to, rates),
  }
}

export function summarizeMonth(month: Month, to: Currency): MonthSummary {
  const { rates, expenses, incomes } = month

  const byBlock = Object.fromEntries(
    BLOCKS.map((block) => {
      const items = expenses.filter((e) => e.block === block)
      const summary: BlockSummary = {
        ...figures(items, to, rates),
        native: {
          budget: expenseTotals(items, (i) => i.budget),
          actual: expenseTotals(items, (i) => i.actual),
          pending: expenseTotals(items, pendingOf),
        },
        itemCount: items.length,
        paidCount: items.filter((i) => itemStatus(i) === 'pagado').length,
      }
      return [block, summary]
    }),
  ) as Record<BlockId, BlockSummary>

  const total = figures(expenses, to, rates)
  const income = consolidate(incomeTotals(incomes), to, rates)
  const advanceItems = expenses.filter((e) => e.isAdvance)

  return {
    ...total,
    currency: to,
    income,
    incomeReceived: consolidate(incomeTotals(incomes.filter((i) => i.received)), to, rates),
    balance: income - total.committed,
    advances: consolidate(expenseTotals(advanceItems, committedOf), to, rates),
    consumptionActual: consolidate(
      expenseTotals(expenses.filter((e) => !e.isAdvance), (i) => i.actual),
      to,
      rates,
    ),
    byBlock,
  }
}

// ---------------------------------------------------------------------------
// Ruteo de liquidez: ¿cuánto mandar a dónde?
// ---------------------------------------------------------------------------

export type RoutingBasis = 'budget' | 'pending'

export interface RoutingPlan {
  basis: RoutingBasis
  rates: MonthRates
  argentina: {
    /** Total a pagar en Argentina, en ARS. */
    totalArs: number
    nexupArs: number
    coveredByNexupArs: number
    /** ARS que faltan y hay que cubrir con dólares de Harry. */
    gapArs: number
    /** USD a enviar desde Harry (redondeado HACIA ARRIBA al centavo). */
    harryToArgentinaUsd: number
    /** ARS de Nexup que sobran tras cubrir Argentina. */
    nexupSurplusArs: number
  }
  spain: {
    /** España + Fondos, en EUR. */
    totalEur: number
    esEur: number
    fondosEur: number
    sweedUsd: number
    harryUsd: number
    /** Lo que queda de Harry tras Argentina, para mandar a Wise. */
    harryToWiseUsd: number
    /** EUR disponibles: Sweed + Harry→Wise convertidos. */
    availableEur: number
    /** availableEur − totalEur (+ sobra / − falta). */
    balanceEur: number
  }
  /** Por "Pagado por": totales en moneda nativa y consolidado en EUR. */
  bySource: Array<{ source: FundingSource; native: CurrencyTotals; eur: number }>
}

function incomeOf(incomes: IncomeItem[], source: IncomeItem['source'], to: Currency, rates: MonthRates) {
  return consolidate(incomeTotals(incomes.filter((i) => i.source === source)), to, rates)
}

export function planRouting(month: Month, basis: RoutingBasis): RoutingPlan {
  const { rates, expenses, incomes } = month
  const amountOf = basis === 'budget' ? (i: ExpenseItem) => i.budget : pendingOf
  const blockTotal = (block: BlockId, to: Currency) =>
    consolidate(expenseTotals(expenses.filter((e) => e.block === block), amountOf), to, rates)

  // Argentina: primero Nexup (ARS), el resto con USD de Harry.
  const totalArs = blockTotal('AR', 'ARS')
  const nexupArs = incomeOf(incomes, 'Nexup', 'ARS', rates)
  const coveredByNexupArs = Math.min(Math.max(nexupArs, 0), totalArs)
  const gapArs = totalArs - coveredByNexupArs
  const harryToArgentinaUsd = convert(gapArs, 'ARS', 'USD', rates, 'up')

  // España + Fondos: Sweed + lo que queda de Harry.
  const esEur = blockTotal('ES', 'EUR')
  const fondosEur = blockTotal('FONDOS', 'EUR')
  const totalEur = esEur + fondosEur
  const sweedUsd = incomeOf(incomes, 'Sweed', 'USD', rates)
  const harryUsd = incomeOf(incomes, 'Harry', 'USD', rates)
  const harryToWiseUsd = harryUsd - harryToArgentinaUsd
  const availableEur = convert(sweedUsd + harryToWiseUsd, 'USD', 'EUR', rates)

  const bySource = FUNDING_SOURCES.map((source) => {
    const native = expenseTotals(expenses.filter((e) => e.source === source), amountOf)
    return { source, native, eur: consolidate(native, 'EUR', rates) }
  })

  return {
    basis,
    rates,
    argentina: {
      totalArs,
      nexupArs,
      coveredByNexupArs,
      gapArs,
      harryToArgentinaUsd,
      nexupSurplusArs: Math.max(nexupArs - totalArs, 0),
    },
    spain: {
      totalEur,
      esEur,
      fondosEur,
      sweedUsd,
      harryUsd,
      harryToWiseUsd,
      availableEur,
      balanceEur: availableEur - totalEur,
    },
    bySource,
  }
}

// ---------------------------------------------------------------------------
// Portafolio
// ---------------------------------------------------------------------------

export interface PortfolioSummary {
  volatile: number
  liquidity: number
  total: number
  byAsset: Array<{ asset: string; value: number }>
  byPlatform: Array<{ platform: string; value: number }>
}

export function summarizePortfolio(holdings: Holding[], to: Currency, rates: MonthRates): PortfolioSummary {
  const sum = (items: Holding[]) =>
    consolidate(totalsBy(items, (h) => h.currency, (h) => h.value), to, rates)
  const group = (key: (h: Holding) => string, items: Holding[]) => {
    const groups = new Map<string, Holding[]>()
    for (const h of items) groups.set(key(h), [...(groups.get(key(h)) ?? []), h])
    return [...groups]
      .map(([k, hs]) => ({ k, value: sum(hs) }))
      .sort((a, b) => b.value - a.value)
  }
  const volatileItems = holdings.filter((h) => h.kind !== 'liquidez')
  const volatile = sum(volatileItems)
  const liquidity = sum(holdings.filter((h) => h.kind === 'liquidez'))
  return {
    volatile,
    liquidity,
    total: sum(holdings),
    byAsset: group((h) => h.asset, volatileItems).map(({ k, value }) => ({ asset: k, value })),
    byPlatform: group((h) => h.platform, holdings).map(({ k, value }) => ({ platform: k, value })),
  }
}

/** Serie histórica para el gráfico de evolución. */
export function monthlyHistory(months: Month[], to: Currency) {
  return [...months]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((m) => {
      const s = summarizeMonth(m, to)
      return { id: m.id, income: s.income, committed: s.committed, actual: s.actual, balance: s.balance }
    })
}
