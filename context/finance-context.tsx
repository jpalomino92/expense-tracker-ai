'use client'

import { createContext, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react'
import type { DisplayCurrency, ExpenseItem, FinanceState, Holding, IncomeItem, Month, MonthRates } from '@/types/finance'
import { cloneMonth, latestMonth, nextMonthId, sortMonths } from '@/lib/months'
import { createSeedState } from '@/lib/seed'
import { localStorageRepository } from '@/lib/storage'

type Action =
  | { type: 'replace'; state: FinanceState }
  | { type: 'selectMonth'; monthId: string }
  | { type: 'setDisplay'; currency: DisplayCurrency }
  | { type: 'setRates'; monthId: string; rates: MonthRates }
  | { type: 'setLocked'; monthId: string; locked: boolean }
  | { type: 'upsertExpense'; monthId: string; item: ExpenseItem }
  | { type: 'deleteExpense'; monthId: string; id: string }
  | { type: 'markPaid'; monthId: string; id: string }
  | { type: 'importExpenses'; monthId: string; items: ExpenseItem[]; mode: 'append' | 'replace' }
  | { type: 'upsertIncome'; monthId: string; item: IncomeItem }
  | { type: 'deleteIncome'; monthId: string; id: string }
  | { type: 'cloneLatest'; onlyFixed: boolean }
  | { type: 'deleteMonth'; monthId: string }
  | { type: 'upsertHolding'; holding: Holding }
  | { type: 'deleteHolding'; id: string }

const upsert = <T extends { id: string }>(list: T[], item: T) =>
  list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item]

/** Aplica `fn` al mes indicado, salvo que esté cerrado. */
function editMonth(state: FinanceState, monthId: string, fn: (m: Month) => Month): FinanceState {
  return {
    ...state,
    months: state.months.map((m) => (m.id === monthId && !m.locked ? fn(m) : m)),
  }
}

function reducer(state: FinanceState, action: Action): FinanceState {
  switch (action.type) {
    case 'replace':
      return action.state
    case 'selectMonth':
      return state.months.some((m) => m.id === action.monthId) ? { ...state, currentMonthId: action.monthId } : state
    case 'setDisplay':
      return { ...state, displayCurrency: action.currency }
    case 'setRates':
      return editMonth(state, action.monthId, (m) => ({ ...m, rates: action.rates }))
    case 'setLocked':
      return {
        ...state,
        months: state.months.map((m) => (m.id === action.monthId ? { ...m, locked: action.locked } : m)),
      }
    case 'upsertExpense':
      return editMonth(state, action.monthId, (m) => ({ ...m, expenses: upsert(m.expenses, action.item) }))
    case 'deleteExpense':
      return editMonth(state, action.monthId, (m) => ({ ...m, expenses: m.expenses.filter((e) => e.id !== action.id) }))
    case 'markPaid':
      return editMonth(state, action.monthId, (m) => ({
        ...m,
        expenses: m.expenses.map((e) => (e.id === action.id ? { ...e, actual: e.budget } : e)),
      }))
    case 'importExpenses':
      return editMonth(state, action.monthId, (m) => ({
        ...m,
        expenses: action.mode === 'replace' ? action.items : [...m.expenses, ...action.items],
      }))
    case 'upsertIncome':
      return editMonth(state, action.monthId, (m) => ({ ...m, incomes: upsert(m.incomes, action.item) }))
    case 'deleteIncome':
      return editMonth(state, action.monthId, (m) => ({ ...m, incomes: m.incomes.filter((i) => i.id !== action.id) }))
    case 'cloneLatest': {
      const source = latestMonth(state.months)
      if (!source) return state
      const month = cloneMonth(source, { onlyFixed: action.onlyFixed })
      return { ...state, months: sortMonths([...state.months, month]), currentMonthId: month.id }
    }
    case 'deleteMonth': {
      if (state.months.length <= 1) return state
      const months = state.months.filter((m) => m.id !== action.monthId)
      const currentMonthId =
        state.currentMonthId === action.monthId ? latestMonth(months)!.id : state.currentMonthId
      return { ...state, months, currentMonthId }
    }
    case 'upsertHolding':
      return { ...state, holdings: upsert(state.holdings, action.holding), portfolioUpdatedAt: new Date().toISOString() }
    case 'deleteHolding':
      return {
        ...state,
        holdings: state.holdings.filter((h) => h.id !== action.id),
        portfolioUpdatedAt: new Date().toISOString(),
      }
  }
}

interface FinanceContextValue {
  state: FinanceState
  dispatch: React.Dispatch<Action>
  currentMonth: Month
  /** Id del mes que se crearía con "Clonar mes anterior". */
  nextCloneId: string
}

const FinanceContext = createContext<FinanceContextValue | null>(null)

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false)
  const [state, dispatch] = useReducer(reducer, undefined, createSeedState)

  useEffect(() => {
    const saved = localStorageRepository.load()
    if (saved) dispatch({ type: 'replace', state: saved })
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) localStorageRepository.save(state)
  }, [state, hydrated])

  const value = useMemo<FinanceContextValue>(() => {
    const currentMonth = state.months.find((m) => m.id === state.currentMonthId) ?? latestMonth(state.months)!
    return { state, dispatch, currentMonth, nextCloneId: nextMonthId(latestMonth(state.months)!.id) }
  }, [state])

  if (!hydrated) {
    return <div className="grid min-h-dvh place-items-center text-sm text-muted">Cargando…</div>
  }
  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
}

export function useFinance(): FinanceContextValue {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error('useFinance debe usarse dentro de <FinanceProvider>')
  return ctx
}
