import Papa from 'papaparse'
import type { BlockId, Currency, ExpenseItem, FundingSource, Month } from '@/types/finance'
import { itemStatus } from '@/lib/calc'
import { parseToCents } from '@/lib/money'
import { newId } from '@/lib/months'

/** Columnas del CSV de gastos (export e import usan las mismas). */
export const CSV_COLUMNS = [
  'bloque', 'nombre', 'categoria', 'moneda', 'presupuesto', 'real', 'fuente', 'fijo', 'adelanto', 'estado',
] as const

const centsToPlain = (c: number) => (c / 100).toFixed(2)

export function monthToCsv(month: Month): string {
  return Papa.unparse({
    fields: [...CSV_COLUMNS],
    data: month.expenses.map((e) => [
      e.block, e.name, e.category, e.currency, centsToPlain(e.budget), centsToPlain(e.actual),
      e.source, e.fixed ? 'si' : 'no', e.isAdvance ? 'si' : 'no', itemStatus(e),
    ]),
  })
}

export interface CsvImportResult {
  items: ExpenseItem[]
  errors: string[]
}

const BLOCK_ALIASES: Record<string, BlockId> = {
  es: 'ES', espana: 'ES', españa: 'ES', ar: 'AR', argentina: 'AR', fondos: 'FONDOS', ahorro: 'FONDOS',
}
const SOURCES: FundingSource[] = ['Sweed', 'Harry', 'Nexup', 'Galicia', 'Wise']
const yes = (v: string | undefined) => /^(si|sí|yes|true|1|x)$/i.test((v ?? '').trim())

/** Parsea un CSV con las columnas de CSV_COLUMNS. `estado` se ignora (se deriva). */
export function csvToExpenses(text: string): CsvImportResult {
  const parsed = Papa.parse<Record<string, string>>(text.trim(), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  })
  const errors = parsed.errors.map((e) => `Fila ${(e.row ?? 0) + 2}: ${e.message}`)
  const items: ExpenseItem[] = []

  parsed.data.forEach((row, i) => {
    const line = i + 2
    const block = BLOCK_ALIASES[(row.bloque ?? '').trim().toLowerCase()]
    const currency = (row.moneda ?? '').trim().toUpperCase() as Currency
    const budget = parseToCents(row.presupuesto ?? '0')
    const actual = parseToCents(row.real || '0')
    const source = SOURCES.find((s) => s.toLowerCase() === (row.fuente ?? '').trim().toLowerCase())
    const name = (row.nombre ?? '').trim()

    const problems = [
      !block && `bloque "${row.bloque}" inválido (ES, AR o FONDOS)`,
      !['USD', 'EUR', 'ARS'].includes(currency) && `moneda "${row.moneda}" inválida`,
      budget === null && `presupuesto "${row.presupuesto}" no es un número`,
      actual === null && `real "${row.real}" no es un número`,
      !source && `fuente "${row.fuente}" inválida (${SOURCES.join(', ')})`,
      !name && 'falta el nombre',
    ].filter(Boolean)

    if (problems.length) {
      errors.push(`Fila ${line}: ${problems.join('; ')}`)
      return
    }
    items.push({
      id: newId(),
      block: block!,
      name,
      category: (row.categoria ?? '').trim() || 'Otros',
      currency,
      budget: budget!,
      actual: actual!,
      source: source!,
      fixed: yes(row.fijo),
      isAdvance: yes(row.adelanto),
    })
  })

  return { items, errors }
}

export function downloadFile(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
