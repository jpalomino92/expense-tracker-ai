import type {
  BlockId,
  Currency,
  ExpenseItem,
  FinanceState,
  FundingSource,
  Holding,
  HoldingKind,
  IncomeItem,
  Month,
  MonthRates,
} from '../types/finance.ts'
import { unitsToCents } from './money.ts'
import { newId } from './months.ts'

/**
 * Semilla inicial Oct 2026 – Ene 2027. Reconstruida a partir de la estructura
 * del Excel y de los totales por bloque de `finanzas_familiares_jun_ene.json`
 * (aprox.). Los montos son editables: ajustalos en "Carga".
 */

interface Row {
  name: string
  category: string
  source: FundingSource
  fixed?: boolean
  advance?: boolean
  /** Presupuesto por mes en unidades (no centavos): [oct, nov, dic, ene] */
  budget: [number, number, number, number]
}

const ES: Row[] = [
  { name: 'Alquiler', category: 'Vivienda', source: 'Wise', budget: [1267, 1267, 1267, 1267] },
  { name: 'Comida', category: 'Comida', source: 'Wise', budget: [1000, 1000, 1000, 1050] },
  { name: 'Luz', category: 'Servicios', source: 'Wise', budget: [90, 95, 110, 110] },
  { name: 'Agua', category: 'Servicios', source: 'Wise', budget: [35, 35, 35, 35] },
  { name: 'Teléfono / Internet', category: 'Servicios', source: 'Wise', budget: [60, 60, 60, 60] },
  { name: 'Salidas', category: 'Salidas', source: 'Wise', budget: [300, 300, 320, 300] },
  { name: 'Sueldo Juan', category: 'Sueldos', source: 'Wise', budget: [300, 300, 300, 300] },
  { name: 'Sueldo Jenni', category: 'Sueldos', source: 'Wise', budget: [300, 300, 300, 300] },
  { name: 'Sueldo Paola', category: 'Sueldos', source: 'Wise', budget: [200, 200, 200, 200] },
  { name: 'Mesada David', category: 'Sueldos', source: 'Wise', budget: [100, 100, 100, 100] },
  { name: 'Salud / Mounjaro', category: 'Salud', source: 'Wise', budget: [280, 280, 280, 280] },
  { name: 'Contador España', category: 'Profesionales', source: 'Wise', budget: [120, 120, 120, 120] },
  { name: 'Reserva Impuestos Autónomo', category: 'Impuestos', source: 'Sweed', budget: [1300, 1050, 1050, 1500] },
  { name: 'Netflix', category: 'Suscripciones', source: 'Wise', budget: [18, 18, 18, 18] },
  { name: 'YouTube', category: 'Suscripciones', source: 'Wise', budget: [14, 14, 14, 14] },
  { name: 'Kindle', category: 'Suscripciones', source: 'Wise', budget: [10, 10, 10, 10] },
  { name: 'Crunchyroll', category: 'Suscripciones', source: 'Wise', budget: [6, 6, 6, 6] },
  { name: 'Amazon', category: 'Suscripciones', source: 'Wise', budget: [5, 5, 5, 5] },
  { name: 'Google', category: 'Suscripciones', source: 'Wise', budget: [2, 2, 2, 2] },
  { name: 'Adelanto Sweed', category: 'Adelanto Sweed', source: 'Sweed', fixed: false, advance: true, budget: [750, 450, 450, 0] },
]

const AR: Row[] = [
  { name: 'Psicóloga Juan', category: 'Salud mental', source: 'Nexup', budget: [180000, 180000, 180000, 190000] },
  { name: 'Psicóloga Jenni', category: 'Salud mental', source: 'Nexup', budget: [180000, 180000, 180000, 190000] },
  { name: 'Psicóloga Gaby', category: 'Salud mental', source: 'Nexup', budget: [150000, 150000, 150000, 160000] },
  { name: 'Mascotas', category: 'Mascotas', source: 'Nexup', budget: [120000, 120000, 120000, 120000] },
  { name: 'Visa Juan', category: 'Tarjetas', source: 'Galicia', fixed: false, budget: [200000, 150000, 0, 0] },
  { name: 'Master Juan', category: 'Tarjetas', source: 'Galicia', fixed: false, budget: [150000, 100000, 0, 0] },
  { name: 'Visa Jenni', category: 'Tarjetas', source: 'Galicia', fixed: false, budget: [180000, 150000, 0, 0] },
  { name: 'Master Jenni', category: 'Tarjetas', source: 'Galicia', fixed: false, budget: [120000, 80000, 0, 0] },
  { name: 'Cuota Mónica', category: 'Deudas', source: 'Nexup', budget: [200000, 200000, 200000, 0] },
  { name: 'Contador AR', category: 'Profesionales', source: 'Nexup', budget: [90000, 90000, 90000, 95000] },
  { name: 'Monotributo / Ingresos Brutos', category: 'Impuestos', source: 'Nexup', budget: [214800, 214800, 214800, 230000] },
  { name: 'Auto / Seguro', category: 'Auto', source: 'Galicia', budget: [140000, 140000, 140000, 145000] },
]

const FONDOS: Row[] = [
  { name: 'Fondo de Emergencia', category: 'Emergencia', source: 'Sweed', budget: [600, 900, 1200, 1577] },
  { name: 'Fondo Diciembre / Navidad', category: 'Sinking fund', source: 'Sweed', budget: [300, 400, 670, 300] },
  { name: 'Fondo Auto', category: 'Sinking fund', source: 'Sweed', budget: [150, 150, 150, 300] },
  { name: 'Fondo David', category: 'Sinking fund', source: 'Sweed', budget: [100, 100, 100, 150] },
  { name: 'Gym', category: 'Deporte', source: 'Wise', budget: [120, 120, 120, 120] },
  { name: 'Funcional Control', category: 'Salud', source: 'Wise', budget: [80, 80, 80, 80] },
  { name: 'Medicaciones fijas', category: 'Salud', source: 'Wise', budget: [150, 150, 150, 150] },
]

const MONTHS: Array<{ id: string; rates: MonthRates; nexupArs: number }> = [
  { id: '2026-10', rates: { usdArs: 1500, usdEur: 0.85 }, nexupArs: 2_004_000 },
  { id: '2026-11', rates: { usdArs: 1450, usdEur: 0.85 }, nexupArs: 2_100_000 },
  { id: '2026-12', rates: { usdArs: 1450, usdEur: 0.85 }, nexupArs: 2_100_000 },
  { id: '2027-01', rates: { usdArs: 1420, usdEur: 0.85 }, nexupArs: 2_200_000 },
]

/** Octubre está en curso: estos ítems quedan sin pagar o parciales (unidades). */
const OCTOBER_UNPAID: Record<string, number> = {
  Comida: 620,
  'Fondo de Emergencia': 0,
  'Fondo Diciembre / Navidad': 0,
  'Visa Juan': 0,
  'Monotributo / Ingresos Brutos': 0,
}

function expenses(block: BlockId, currency: Currency, rows: Row[], monthIndex: number): ExpenseItem[] {
  return rows.map((r) => {
    const budget = unitsToCents(r.budget[monthIndex])
    const octoberActual = r.name in OCTOBER_UNPAID ? unitsToCents(OCTOBER_UNPAID[r.name]) : budget
    return {
      id: newId(),
      block,
      name: r.name,
      category: r.category,
      currency,
      budget,
      actual: monthIndex === 0 ? octoberActual : 0,
      source: r.source,
      fixed: r.fixed ?? true,
      isAdvance: r.advance ?? false,
    }
  })
}

function incomes(nexupArs: number, received: boolean): IncomeItem[] {
  return [
    { id: newId(), source: 'Sweed', label: 'Sweed', currency: 'USD', amount: unitsToCents(5400), received },
    { id: newId(), source: 'Harry', label: 'Harry', currency: 'USD', amount: unitsToCents(3500), received },
    { id: newId(), source: 'Nexup', label: 'Nexup / Jennifer', currency: 'ARS', amount: unitsToCents(nexupArs), received },
  ]
}

function seedMonths(): Month[] {
  return MONTHS.map((m, i) => ({
    id: m.id,
    rates: m.rates,
    locked: false,
    incomes: incomes(m.nexupArs, i === 0),
    expenses: [
      ...expenses('ES', 'EUR', ES, i),
      ...expenses('AR', 'ARS', AR, i),
      ...expenses('FONDOS', 'EUR', FONDOS, i),
    ],
  }))
}

/** Estructura del portafolio con saldos en 0: cargá tus valores reales. */
function seedHoldings(): Holding[] {
  const h = (platform: string, asset: string, kind: HoldingKind, currency: Currency = 'USD'): Holding => ({
    id: newId(), platform, asset, kind, quantity: 0, value: 0, currency,
  })
  return [
    ...['BTC', 'ETH', 'NEXO', 'UNI', 'XRP'].map((a) => h('Nexo Juan', a, 'cripto')),
    ...['BTC', 'ETH'].map((a) => h('Nexo Jenn', a, 'cripto')),
    ...['QQQ', 'QQQM', 'VEA', 'VTI', 'MU', 'ANET', 'LLY', 'JNJ', 'SYP'].map((a) => h('IBKR', a, 'accion')),
    h('Banco', 'Fondo de Emergencia EUR', 'liquidez', 'EUR'),
    h('Wise', 'Fondo de Emergencia USD', 'liquidez', 'USD'),
  ]
}

export function createSeedState(): FinanceState {
  return {
    version: 1,
    months: seedMonths(),
    currentMonthId: '2026-10',
    displayCurrency: 'EUR',
    holdings: seedHoldings(),
    portfolioUpdatedAt: null,
  }
}
