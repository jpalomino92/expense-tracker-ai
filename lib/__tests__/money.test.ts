import { test } from 'node:test'
import assert from 'node:assert/strict'
import { consolidate, convert, normalizeDecimal, parseRate, parseToCents } from '../money.ts'
import { cloneMonth } from '../months.ts'
import { itemStatus, planRouting, summarizeMonth } from '../calc.ts'
import { createSeedState } from '../seed.ts'
import type { ExpenseItem, Month } from '../../types/finance.ts'

const rates = { usdArs: 1500, usdEur: 0.85 }

test('parseo de montos en formatos AR/ES/US', () => {
  assert.equal(parseToCents('1.267'), 126700)
  assert.equal(parseToCents('1.267,50'), 126750)
  assert.equal(parseToCents('1,267.50'), 126750)
  assert.equal(parseToCents('1267.5'), 126750)
  assert.equal(parseToCents('2.100.000'), 210000000)
  assert.equal(parseToCents('€ 1.000'), 100000)
  assert.equal(parseToCents('0,005'), 1)
  assert.equal(parseToCents('-12,3'), -1230)
  assert.equal(parseToCents('abc'), null)
  assert.equal(parseToCents('1.2.3,4.5'), null)
  assert.equal(normalizeDecimal('0.850'), '0.850')
  assert.equal(parseRate('1.500'), 1500)
  assert.equal(parseRate('0,85'), 0.85)
})

test('conversión exacta con un único redondeo', () => {
  assert.equal(convert(540000, 'USD', 'EUR', rates), 459000) // 5400 USD → 4590 EUR
  assert.equal(convert(459000, 'EUR', 'USD', rates), 540000)
  assert.equal(convert(200400000, 'ARS', 'USD', rates), 133600) // 2.004.000 ARS → 1336 USD
  // ARS → EUR directo, sin redondear en USD: 1.000 ARS = 0,5666… EUR
  assert.equal(convert(100000, 'ARS', 'EUR', rates), 57)
  assert.equal(convert(1, 'ARS', 'USD', rates, 'up'), 1)
  assert.equal(convert(1, 'ARS', 'USD', rates), 0)
})

test('nunca suma monedas sin convertir', () => {
  const total = consolidate({ USD: 100000, EUR: 85000, ARS: 150000000 }, 'USD', rates)
  assert.equal(total, 100000 + 100000 + 100000)
})

test('estado derivado', () => {
  assert.equal(itemStatus({ budget: 100, actual: 0 }), 'pendiente')
  assert.equal(itemStatus({ budget: 100, actual: 40 }), 'parcial')
  assert.equal(itemStatus({ budget: 100, actual: 100 }), 'pagado')
  assert.equal(itemStatus({ budget: 100, actual: 150 }), 'pagado')
})

const item = (over: Partial<ExpenseItem>): ExpenseItem => ({
  id: 'x', block: 'ES', name: 'x', category: 'x', currency: 'EUR', budget: 0, actual: 0,
  source: 'Wise', fixed: true, isAdvance: false, ...over,
})

test('resumen mensual y ruteo', () => {
  const month: Month = {
    id: '2026-10',
    rates,
    locked: false,
    incomes: [
      { id: 'a', source: 'Sweed', label: 'Sweed', currency: 'USD', amount: 540000, received: true },
      { id: 'b', source: 'Harry', label: 'Harry', currency: 'USD', amount: 350000, received: true },
      { id: 'c', source: 'Nexup', label: 'Nexup', currency: 'ARS', amount: 150000000, received: true },
    ],
    expenses: [
      item({ budget: 126700, actual: 126700 }),
      item({ budget: 100000, actual: 120000 }), // se pasó: compromete 1200
      item({ block: 'AR', currency: 'ARS', budget: 300000000, actual: 0, source: 'Nexup' }),
      item({ block: 'FONDOS', budget: 60000, actual: 0, source: 'Sweed' }),
    ],
  }
  const s = summarizeMonth(month, 'EUR')
  // ingreso: 8900 USD → 7565 EUR + 1.500.000 ARS → 850 EUR
  assert.equal(s.income, 756500 + 85000)
  // pendiente: 3.000.000 ARS (1700 EUR) + 600 EUR
  assert.equal(s.pending, 170000 + 60000)
  // compromiso: 1267 + 1200 + 1700 + 600
  assert.equal(s.committed, 126700 + 120000 + 170000 + 60000)
  assert.equal(s.balance, s.income - s.committed)

  const r = planRouting(month, 'budget')
  assert.equal(r.argentina.totalArs, 300000000)
  assert.equal(r.argentina.coveredByNexupArs, 150000000)
  assert.equal(r.argentina.harryToArgentinaUsd, 100000) // 1.500.000 ARS / 1500
  assert.equal(r.spain.harryToWiseUsd, 250000)
  assert.equal(r.spain.availableEur, convert(790000, 'USD', 'EUR', rates))
  assert.equal(r.spain.totalEur, 126700 + 100000 + 60000)
})

test('clonar mes: Real a 0, mismo presupuesto, mes siguiente', () => {
  const seed = createSeedState()
  const jan = seed.months.find((m) => m.id === '2027-01')!
  const feb = cloneMonth({ ...jan, expenses: jan.expenses.map((e) => ({ ...e, actual: e.budget })) }, { onlyFixed: true })
  assert.equal(feb.id, '2027-02')
  assert.ok(feb.expenses.every((e) => e.actual === 0 && e.fixed))
  assert.ok(feb.expenses.every((e) => jan.expenses.some((j) => j.name === e.name && j.budget === e.budget)))
  assert.ok(feb.incomes.every((i) => !i.received))
  assert.deepEqual(feb.rates, jan.rates)
})

test('la semilla se parece a los totales del Excel', () => {
  const oct = createSeedState().months[0]
  const s = summarizeMonth(oct, 'USD')
  assert.equal(s.income, 1023600) // 10.236 USD como en el JSON
})
