'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Check, ChevronDown, Plus, Trash2, Undo2 } from 'lucide-react'
import type { BlockId, Currency, ExpenseItem, IncomeItem } from '@/types/finance'
import { useFinance } from '@/context/finance-context'
import { expenseTotals, incomeTotals, itemStatus, pendingOf } from '@/lib/calc'
import { consolidate, convert, type CurrencyTotals } from '@/lib/money'
import { newId } from '@/lib/months'
import { BLOCK_META, CURRENCIES, FUNDING_SOURCE_LIST, INCOME_SOURCES } from '@/constants/catalog'
import { MonthToolbar } from '@/components/month-toolbar'
import {
  Button, Card, DeleteButton, EmptyState, Money, MoneyInput, Segmented, Select, StatusBadge, cn, inputClass,
} from '@/components/ui/primitives'

type Tab = 'INGRESOS' | BlockId
type StatusFilter = 'todos' | 'abiertos' | 'pagados'

function TextInput({ value, onCommit, label, disabled, className }: {
  value: string; onCommit: (v: string) => void; label: string; disabled?: boolean; className?: string
}) {
  const [draft, setDraft] = useState<string | null>(null)
  return (
    <input
      aria-label={label}
      disabled={disabled}
      value={draft ?? value}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (draft !== null && draft.trim() && draft.trim() !== value) onCommit(draft.trim())
        setDraft(null)
      }}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      className={cn(inputClass, className)}
    />
  )
}

function Totals({ totals, label }: { totals: CurrencyTotals; label: string }) {
  const { state, currentMonth } = useFinance()
  const present = CURRENCIES.filter((c) => totals[c] !== 0)
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
      <span className="text-muted">{label}</span>
      <span className="flex flex-wrap items-baseline gap-x-3">
        {present.map((c, i) => (
          <span key={c} className="font-semibold">
            {i > 0 && <span className="mr-3 font-normal text-muted">+</span>}
            <Money cents={totals[c]} currency={c} />
          </span>
        ))}
        {(present.length > 1 || (present[0] && present[0] !== state.displayCurrency)) && (
          <span className="text-xs text-muted">
            ≈ <Money cents={consolidate(totals, state.displayCurrency, currentMonth.rates)} currency={state.displayCurrency} />
          </span>
        )}
      </span>
    </div>
  )
}

function ExpenseRow({ item, locked }: { item: ExpenseItem; locked: boolean }) {
  const { dispatch, currentMonth } = useFinance()
  const [open, setOpen] = useState(false)
  const monthId = currentMonth.id
  const save = (patch: Partial<ExpenseItem>) =>
    dispatch({ type: 'upsertExpense', monthId, item: { ...item, ...patch } })
  const status = itemStatus(item)
  const paid = status === 'pagado' && item.budget > 0

  return (
    <li className="border-b border-border py-3 last:border-0">
      <div className="grid grid-cols-[1fr_auto] items-center gap-2 md:grid-cols-[minmax(10rem,1.6fr)_8rem_8rem_8rem_2.5rem_6rem_2rem]">
        <div className="min-w-0">
          <TextInput value={item.name} label="Nombre" disabled={locked} onCommit={(name) => save({ name })} className="font-medium" />
          <p className="mt-1 truncate px-1 text-[11px] text-muted md:hidden">
            {item.category} · {item.source}
            {item.isAdvance && ' · adelanto'}
          </p>
        </div>
        <div className="md:hidden"><StatusBadge status={status} /></div>

        <Select
          label="Pagado por"
          value={item.source}
          options={FUNDING_SOURCE_LIST}
          disabled={locked}
          onChange={(source) => save({ source })}
          className="hidden md:block"
        />

        <div className="col-span-2 grid grid-cols-[1fr_1fr_auto] gap-2 md:col-span-3 md:grid-cols-[8rem_8rem_2.5rem]">
          <label className="text-[11px] text-muted md:contents">
            <span className="md:sr-only">Presupuestado</span>
            <MoneyInput label={`Presupuestado ${item.name}`} cents={item.budget} currency={item.currency} disabled={locked} onCommit={(budget) => save({ budget })} />
          </label>
          <label className="text-[11px] text-muted md:contents">
            <span className="md:sr-only">Real pagado</span>
            <MoneyInput label={`Real ${item.name}`} cents={item.actual} currency={item.currency} disabled={locked} onCommit={(actual) => save({ actual })} />
          </label>
          <div className="flex items-end md:items-center">
            {paid ? (
              <button
                type="button"
                disabled={locked}
                onClick={() => save({ actual: 0 })}
                title="Deshacer: Real = 0"
                aria-label={`Deshacer pago de ${item.name}`}
                className="grid size-9 place-items-center rounded-lg border border-border text-muted hover:text-ink disabled:opacity-40"
              >
                <Undo2 className="size-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={locked}
                onClick={() => dispatch({ type: 'markPaid', monthId, id: item.id })}
                title="Marcar como pagado (Real = Presupuesto)"
                aria-label={`Marcar ${item.name} como pagado`}
                className="grid size-9 place-items-center rounded-lg bg-good-mark text-white hover:brightness-110 disabled:opacity-40"
              >
                <Check className="size-4" />
              </button>
            )}
          </div>
        </div>

        <div className="hidden md:block"><StatusBadge status={status} /></div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={`Más opciones de ${item.name}`}
          className="col-span-2 flex items-center justify-center gap-1 rounded-lg py-1 text-xs text-muted hover:bg-surface-2 md:col-span-1"
        >
          <span className="md:sr-only">Más opciones</span>
          <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} />
        </button>
      </div>

      {open && (
        <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-surface-2 p-3 text-xs sm:grid-cols-4">
          <label className="space-y-1">
            <span className="text-muted">Categoría</span>
            <Select
              label="Categoría"
              value={item.category}
              disabled={locked}
              options={[...new Set([...BLOCK_META[item.block].categories, item.category])]}
              onChange={(category) => save({ category })}
            />
          </label>
          <label className="space-y-1 md:hidden">
            <span className="text-muted">Pagado por</span>
            <Select label="Pagado por" value={item.source} options={FUNDING_SOURCE_LIST} disabled={locked} onChange={(source) => save({ source })} />
          </label>
          <label className="space-y-1">
            <span className="text-muted">Moneda</span>
            <Select<Currency>
              label="Moneda"
              value={item.currency}
              options={CURRENCIES}
              disabled={locked}
              onChange={(currency) =>
                save({
                  currency,
                  budget: convert(item.budget, item.currency, currency, currentMonth.rates),
                  actual: convert(item.actual, item.currency, currency, currentMonth.rates),
                })
              }
            />
          </label>
          <div className="flex flex-col justify-end gap-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" disabled={locked} checked={item.fixed} onChange={(e) => save({ fixed: e.target.checked })} className="size-4" />
              Fijo (se clona)
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" disabled={locked} checked={item.isAdvance} onChange={(e) => save({ isAdvance: e.target.checked })} className="size-4" />
              Adelanto Sweed
            </label>
          </div>
          <div className="flex items-end justify-between gap-2 sm:col-span-4">
            <span className="text-muted">
              Falta pagar: <Money cents={pendingOf(item)} currency={item.currency} />
            </span>
            <DeleteButton
              label={`Eliminar ${item.name}`}
              disabled={locked}
              onConfirm={() => dispatch({ type: 'deleteExpense', monthId, id: item.id })}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 font-medium"
            >
              <Trash2 className="size-3.5" /> Eliminar
            </DeleteButton>
          </div>
        </div>
      )}
    </li>
  )
}

function BlockEditor({ block }: { block: BlockId }) {
  const { dispatch, currentMonth } = useFinance()
  const [filter, setFilter] = useState<StatusFilter>('todos')
  const meta = BLOCK_META[block]
  const all = currentMonth.expenses.filter((e) => e.block === block)
  const items = all.filter((e) => {
    const st = itemStatus(e)
    return filter === 'todos' || (filter === 'pagados' ? st === 'pagado' : st !== 'pagado')
  })
  const { locked } = currentMonth

  const add = () =>
    dispatch({
      type: 'upsertExpense',
      monthId: currentMonth.id,
      item: {
        id: newId(), block, name: 'Nuevo ítem', category: 'Otros', currency: meta.currency,
        budget: 0, actual: 0, source: block === 'AR' ? 'Nexup' : 'Wise', fixed: true, isAdvance: false,
      },
    })

  return (
    <Card>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <Segmented<StatusFilter>
          label="Filtrar por estado"
          size="sm"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'todos', label: `Todos (${all.length})` },
            { value: 'abiertos', label: 'Por pagar' },
            { value: 'pagados', label: 'Pagados' },
          ]}
        />
        <Button size="sm" onClick={add} disabled={locked}>
          <Plus className="size-3.5" /> Agregar ítem
        </Button>
      </div>

      <div className="hidden grid-cols-[minmax(10rem,1.6fr)_8rem_8rem_8rem_2.5rem_6rem_2rem] gap-2 border-b border-border pb-2 text-[11px] font-medium uppercase tracking-wide text-muted md:grid">
        <span>Ítem</span><span>Pagado por</span><span className="text-right">Presupuestado</span>
        <span className="text-right">Real</span><span /><span>Estado</span><span />
      </div>

      {items.length ? (
        <ul>{items.map((item) => <ExpenseRow key={item.id} item={item} locked={locked} />)}</ul>
      ) : (
        <EmptyState>No hay ítems {filter !== 'todos' && 'con ese estado'}.</EmptyState>
      )}

      <div className="mt-3 space-y-1.5 border-t border-border pt-3">
        <Totals label="Presupuestado" totals={expenseTotals(all, (i) => i.budget)} />
        <Totals label="Real pagado" totals={expenseTotals(all, (i) => i.actual)} />
        <Totals label="Pendiente" totals={expenseTotals(all, pendingOf)} />
      </div>
    </Card>
  )
}

function IncomeRow({ item, locked }: { item: IncomeItem; locked: boolean }) {
  const { dispatch, currentMonth } = useFinance()
  const save = (patch: Partial<IncomeItem>) =>
    dispatch({ type: 'upsertIncome', monthId: currentMonth.id, item: { ...item, ...patch } })
  return (
    <li className="grid grid-cols-2 items-center gap-2 border-b border-border py-3 last:border-0 sm:grid-cols-[1fr_7rem_6rem_9rem_7rem_2rem]">
      <TextInput value={item.label} label="Descripción" disabled={locked} onCommit={(label) => save({ label })} className="col-span-2 font-medium sm:col-span-1" />
      <Select label="Fuente" value={item.source} options={INCOME_SOURCES} disabled={locked} onChange={(source) => save({ source })} />
      <Select<Currency>
        label="Moneda"
        value={item.currency}
        options={CURRENCIES}
        disabled={locked}
        onChange={(currency) => save({ currency, amount: convert(item.amount, item.currency, currency, currentMonth.rates) })}
      />
      <MoneyInput label={`Monto ${item.label}`} cents={item.amount} currency={item.currency} disabled={locked} onCommit={(amount) => save({ amount })} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={item.received} disabled={locked} onChange={(e) => save({ received: e.target.checked })} className="size-4" />
        Recibido
      </label>
      <DeleteButton
        label={`Eliminar ${item.label}`}
        disabled={locked}
        onConfirm={() => dispatch({ type: 'deleteIncome', monthId: currentMonth.id, id: item.id })}
        className="grid size-8 place-items-center justify-self-end rounded-lg"
      >
        <Trash2 className="size-4" />
      </DeleteButton>
    </li>
  )
}

function IncomeEditor() {
  const { dispatch, currentMonth } = useFinance()
  const { locked, incomes } = currentMonth
  return (
    <Card>
      <div className="mb-2 flex justify-end">
        <Button
          size="sm"
          disabled={locked}
          onClick={() =>
            dispatch({
              type: 'upsertIncome',
              monthId: currentMonth.id,
              item: { id: newId(), source: 'Otro', label: 'Nuevo ingreso', currency: 'USD', amount: 0, received: false },
            })
          }
        >
          <Plus className="size-3.5" /> Agregar ingreso
        </Button>
      </div>
      {incomes.length ? (
        <ul>{incomes.map((i) => <IncomeRow key={i.id} item={i} locked={locked} />)}</ul>
      ) : (
        <EmptyState>Sin ingresos cargados.</EmptyState>
      )}
      <div className="mt-3 border-t border-border pt-3">
        <Totals label="Total ingresos" totals={incomeTotals(incomes)} />
      </div>
    </Card>
  )
}

const TABS: Array<{ value: Tab; label: string }> = [
  { value: 'ES', label: 'España' },
  { value: 'AR', label: 'Argentina' },
  { value: 'FONDOS', label: 'Fondos' },
  { value: 'INGRESOS', label: 'Ingresos' },
]

function CargaContent() {
  const router = useRouter()
  const params = useSearchParams()
  const { currentMonth } = useFinance()
  const tab = (TABS.find((t) => t.value === params.get('bloque'))?.value ?? 'ES') as Tab

  return (
    <div className="space-y-4">
      <MonthToolbar />
      {currentMonth.locked && (
        <p className="rounded-xl border border-border bg-surface-2 px-4 py-2 text-sm text-ink-2">
          Este mes está cerrado. Reabrilo para editar.
        </p>
      )}
      <div className="overflow-x-auto">
        <Segmented<Tab>
          label="Bloque"
          value={tab}
          onChange={(v) => router.replace(`/carga?bloque=${v}`, { scroll: false })}
          options={TABS}
        />
      </div>
      {tab === 'INGRESOS' ? <IncomeEditor /> : <BlockEditor key={tab} block={tab} />}
    </div>
  )
}

export default function CargaPage() {
  return (
    <Suspense>
      <CargaContent />
    </Suspense>
  )
}
