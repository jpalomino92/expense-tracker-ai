/**
 * Modelo de dominio. Todos los montos son ENTEROS en centavos de su propia
 * moneda (USD, EUR o ARS). Nunca se guardan floats ni se suman monedas
 * distintas sin pasar por `convert` (lib/money.ts).
 */

export type Currency = 'USD' | 'EUR' | 'ARS'
export type DisplayCurrency = 'USD' | 'EUR'

export type BlockId = 'ES' | 'AR' | 'FONDOS'

/** Quién paga / de qué cuenta sale el dinero. */
export type FundingSource = 'Sweed' | 'Harry' | 'Nexup' | 'Galicia' | 'Wise'

/** De dónde entra el dinero. */
export type IncomeSource = 'Sweed' | 'Harry' | 'Nexup' | 'Otro'

export type ItemStatus = 'pendiente' | 'parcial' | 'pagado'

/**
 * Tipos de cambio de un mes. Se guardan con el mes (foto inmutable): cambiar
 * los de un mes nunca afecta a otro.
 *  - usdArs: cuántos ARS vale 1 USD (ej. 1500)
 *  - usdEur: cuántos EUR vale 1 USD (ej. 0.85). EUR→USD se deriva como 1/usdEur
 *    para que USD↔EUR sea siempre consistente.
 */
export interface MonthRates {
  usdArs: number
  usdEur: number
}

export interface ExpenseItem {
  id: string
  block: BlockId
  name: string
  category: string
  currency: Currency
  /** centavos */
  budget: number
  /** centavos */
  actual: number
  source: FundingSource
  /** Se copia al clonar el mes con "solo fijos". */
  fixed: boolean
  /** Adelanto Sweed: sale caja pero no es consumo; se reporta aparte. */
  isAdvance: boolean
  notes?: string
}

export interface IncomeItem {
  id: string
  source: IncomeSource
  label: string
  currency: Currency
  /** centavos */
  amount: number
  received: boolean
}

export interface Month {
  /** YYYY-MM */
  id: string
  rates: MonthRates
  incomes: IncomeItem[]
  expenses: ExpenseItem[]
  /** Mes cerrado: no admite ediciones (evita tocar meses ya conciliados). */
  locked: boolean
}

export type HoldingKind = 'cripto' | 'accion' | 'liquidez'

export interface Holding {
  id: string
  platform: string
  asset: string
  kind: HoldingKind
  /** Cantidad de unidades (informativo, puede ser fraccional). */
  quantity: number
  /** Valor actual en centavos de `currency`. */
  value: number
  currency: Currency
}

export interface FinanceState {
  version: 1
  months: Month[]
  currentMonthId: string
  displayCurrency: DisplayCurrency
  holdings: Holding[]
  /** ISO datetime de la última actualización de saldos del portafolio. */
  portfolioUpdatedAt: string | null
}
