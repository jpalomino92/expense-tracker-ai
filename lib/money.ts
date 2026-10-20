import type { Currency, MonthRates } from '../types/finance.ts'

/**
 * Aritmética monetaria exacta.
 *
 * - Montos: enteros en centavos (Number.isSafeInteger).
 * - Tasas: se escalan a enteros de 6 decimales (micro) y toda conversión se
 *   hace en BigInt con UN solo redondeo final (half away from zero), incluso
 *   en cruces ARS↔EUR (que pasan por USD sin redondeo intermedio).
 */

const RATE_DECIMALS = 6
const RATE_SCALE = 10n ** BigInt(RATE_DECIMALS)

export type Rounding = 'half' | 'up'

export function rateToMicro(rate: number): bigint {
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new RangeError(`Tipo de cambio inválido: ${rate}`)
  }
  return BigInt(Math.round(rate * 10 ** RATE_DECIMALS))
}

/** a / b redondeado. b > 0. */
function divRound(a: bigint, b: bigint, rounding: Rounding): bigint {
  const q = a / b
  const r = a % b
  if (r === 0n) return q
  const sign = a < 0n ? -1n : 1n
  if (rounding === 'up') return q + sign
  const absR = r < 0n ? -r : r
  return absR * 2n >= b ? q + sign : q
}

/** Unidades de `currency` por 1 USD, escaladas a micro. */
function perUsdMicro(currency: Currency, rates: MonthRates): bigint {
  switch (currency) {
    case 'USD':
      return RATE_SCALE
    case 'EUR':
      return rateToMicro(rates.usdEur)
    case 'ARS':
      return rateToMicro(rates.usdArs)
  }
}

function assertCents(cents: number): void {
  if (!Number.isSafeInteger(cents)) {
    throw new TypeError(`Monto no entero en centavos: ${cents}`)
  }
}

/** Convierte centavos de `from` a centavos de `to` con un único redondeo. */
export function convert(
  cents: number,
  from: Currency,
  to: Currency,
  rates: MonthRates,
  rounding: Rounding = 'half',
): number {
  assertCents(cents)
  if (from === to) return cents
  const num = BigInt(cents) * perUsdMicro(to, rates)
  return Number(divRound(num, perUsdMicro(from, rates), rounding))
}

export type CurrencyTotals = Record<Currency, number>

export const zeroTotals = (): CurrencyTotals => ({ USD: 0, EUR: 0, ARS: 0 })

export function addTo(totals: CurrencyTotals, currency: Currency, cents: number): CurrencyTotals {
  assertCents(cents)
  totals[currency] += cents
  return totals
}

/**
 * Consolida totales multimoneda en una sola moneda. Primero se suma exacto
 * por moneda (enteros) y luego se convierte cada subtotal una sola vez.
 */
export function consolidate(totals: CurrencyTotals, to: Currency, rates: MonthRates): number {
  return (Object.keys(totals) as Currency[]).reduce(
    (sum, c) => sum + convert(totals[c], c, to, rates),
    0,
  )
}

// ---------------------------------------------------------------------------
// Parseo de texto ingresado por el usuario
// ---------------------------------------------------------------------------

/**
 * Normaliza un número escrito a mano ("1.267,50", "1,267.50", "1267.5",
 * "1.500") a la forma "1267.50" sin pasar por float. Devuelve null si no es
 * un número válido. Un único separador seguido de exactamente 3 dígitos en
 * grupos ("1.500", "2.100.000") se interpreta como separador de miles.
 */
export function normalizeDecimal(input: string): string | null {
  let s = input.trim().replace(/[\s€$]|US\$|USD|EUR|ARS/gi, '')
  let negative = false
  if (s.startsWith('-')) {
    negative = true
    s = s.slice(1)
  }
  if (!s || !/^[\d.,]+$/.test(s)) return null

  const lastDot = s.lastIndexOf('.')
  const lastComma = s.lastIndexOf(',')
  let intPart: string
  let decPart = ''

  if (lastDot !== -1 && lastComma !== -1) {
    const decSep = lastDot > lastComma ? '.' : ','
    const thouSep = decSep === '.' ? ',' : '.'
    const [i, d, ...rest] = s.split(decSep)
    if (rest.length) return null
    intPart = i.split(thouSep).join('')
    decPart = d
  } else if (lastDot !== -1 || lastComma !== -1) {
    const sep = lastDot !== -1 ? '.' : ','
    const groups = s.split(sep)
    const looksLikeThousands =
      groups.length > 1 && groups[0].length >= 1 && groups[0].length <= 3 && groups[0] !== '0' &&
      groups.slice(1).every((g) => g.length === 3)
    if (looksLikeThousands) {
      intPart = groups.join('')
    } else if (groups.length === 2) {
      intPart = groups[0]
      decPart = groups[1]
    } else {
      return null
    }
  } else {
    intPart = s
  }

  if (!/^\d*$/.test(intPart) || !/^\d*$/.test(decPart)) return null
  if (!intPart && !decPart) return null
  const normalized = `${intPart || '0'}${decPart ? `.${decPart}` : ''}`
  return negative ? `-${normalized}` : normalized
}

/** Texto → centavos enteros, redondeando el 3er decimal (half up), sin floats. */
export function parseToCents(input: string): number | null {
  const n = normalizeDecimal(input)
  if (n === null) return null
  const negative = n.startsWith('-')
  const [i, d = ''] = (negative ? n.slice(1) : n).split('.')
  const padded = (d + '000').slice(0, 3)
  let cents = BigInt(i) * 100n + BigInt(padded.slice(0, 2))
  if (Number(padded[2]) >= 5) cents += 1n
  const result = Number(negative ? -cents : cents)
  return Number.isSafeInteger(result) ? result : null
}

/** Texto → número decimal (para tipos de cambio). */
export function parseRate(input: string): number | null {
  const n = normalizeDecimal(input)
  if (n === null) return null
  const v = Number(n)
  return Number.isFinite(v) && v > 0 ? v : null
}

/** Unidades enteras/decimales (ej. 1267.5) → centavos. Solo para semillas/importación. */
export function unitsToCents(units: number): number {
  return parseToCents(String(units)) ?? 0
}

// ---------------------------------------------------------------------------
// Formato
// ---------------------------------------------------------------------------

const LOCALE = 'es-AR'
const formatters = new Map<string, Intl.NumberFormat>()

function getFormatter(key: string, opts: Intl.NumberFormatOptions): Intl.NumberFormat {
  let f = formatters.get(key)
  if (!f) {
    f = new Intl.NumberFormat(LOCALE, opts)
    formatters.set(key, f)
  }
  return f
}

const SYMBOL: Record<Currency, string> = { USD: 'US$', EUR: '€', ARS: '$' }

export interface FormatOptions {
  /** Omite decimales (por defecto: ARS sin decimales, USD/EUR con 2). */
  decimals?: 0 | 2
  /** Muestra signo + en positivos. */
  signed?: boolean
  /** Formato corto (12,3 k / 1,9 M) para ejes de gráficos. */
  compact?: boolean
}

export function formatMoney(cents: number, currency: Currency, opts: FormatOptions = {}): string {
  const decimals = opts.decimals ?? (currency === 'ARS' ? 0 : 2)
  const key = `${decimals}|${opts.signed ? 1 : 0}|${opts.compact ? 1 : 0}`
  const f = getFormatter(key, {
    minimumFractionDigits: opts.compact ? 0 : decimals,
    maximumFractionDigits: opts.compact ? 1 : decimals,
    notation: opts.compact ? 'compact' : 'standard',
    signDisplay: opts.signed ? 'exceptZero' : 'auto',
  })
  return `${SYMBOL[currency]} ${f.format(cents / 100)}`
}

/** Centavos → texto editable ("1267,50"), sin separador de miles. */
export function centsToInput(cents: number): string {
  const negative = cents < 0
  const abs = Math.abs(cents)
  const s = `${Math.trunc(abs / 100)},${String(abs % 100).padStart(2, '0')}`
  return negative ? `-${s}` : s
}

export function formatRate(rate: number, decimals = 4): string {
  return getFormatter(`rate${decimals}`, { maximumFractionDigits: decimals }).format(rate)
}
