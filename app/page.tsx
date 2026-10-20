'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { ArrowDownRight, ArrowUpRight, HandCoins, Info } from 'lucide-react'
import { useFinance } from '@/context/finance-context'
import { BLOCKS, monthlyHistory, summarizeMonth } from '@/lib/calc'
import { formatMoney } from '@/lib/money'
import { monthLabel } from '@/lib/months'
import { BLOCK_META } from '@/constants/catalog'
import { MonthToolbar } from '@/components/month-toolbar'
import { GroupedBarChart, TrendLineChart } from '@/components/charts'
import { Card, CardTitle, Money, ProgressBar } from '@/components/ui/primitives'

function Kpi({ label, children, sub }: { label: string; children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <Card className="flex flex-col gap-1.5">
      <p className="text-xs font-medium text-muted">{label}</p>
      <div className="text-2xl font-semibold leading-tight sm:text-[1.7rem]">{children}</div>
      {sub && <div className="text-xs text-ink-2">{sub}</div>}
    </Card>
  )
}

const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0)

export default function DashboardPage() {
  const { state, currentMonth } = useFinance()
  const cur = state.displayCurrency
  const s = useMemo(() => summarizeMonth(currentMonth, cur), [currentMonth, cur])
  const history = useMemo(
    () => monthlyHistory(state.months, cur).map((h) => ({ ...h, mes: monthLabel(h.id, true) })),
    [state.months, cur],
  )
  const other = cur === 'EUR' ? 'USD' : 'EUR'
  const incomeOther = useMemo(() => summarizeMonth(currentMonth, other).income, [currentMonth, other])
  const pendingCount = currentMonth.expenses.filter((e) => e.actual < e.budget).length
  const surplus = s.balance >= 0

  const blockChart = BLOCKS.map((b) => ({
    bloque: BLOCK_META[b].label,
    budget: s.byBlock[b].budget,
    actual: s.byBlock[b].actual,
  }))

  return (
    <div className="space-y-4">
      <MonthToolbar />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Ingreso total del mes" sub={<>≈ {formatMoney(incomeOther, other)} · recibido {formatMoney(s.incomeReceived, cur)}</>}>
          <Money cents={s.income} currency={cur} />
        </Kpi>

        <Kpi
          label="Presupuestado vs. ejecutado real"
          sub={
            <div className="space-y-1.5">
              <ProgressBar value={s.actual} max={s.budget} label="Ejecutado sobre presupuestado" />
              <p>
                {pct(s.actual, s.budget)}% de <Money cents={s.budget} currency={cur} />
              </p>
            </div>
          }
        >
          <Money cents={s.actual} currency={cur} />
        </Kpi>

        <Kpi label="Pendiente por pagar" sub={`${pendingCount} ítem${pendingCount === 1 ? '' : 's'} sin completar`}>
          <Money cents={s.pending} currency={cur} />
        </Kpi>

        <Kpi
          label="Balance libre real"
          sub={
            <span className="inline-flex items-center gap-1">
              {surplus ? <ArrowUpRight className="size-3.5 text-good" /> : <ArrowDownRight className="size-3.5 text-bad" />}
              {surplus ? 'Superávit' : 'Déficit'} · ingreso − compromiso
            </span>
          }
        >
          <Money cents={s.balance} currency={cur} signed tone />
        </Kpi>
      </div>

      {s.advances > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4 text-sm">
          <HandCoins className="mt-0.5 size-4 shrink-0 text-ink-2" />
          <p className="text-ink-2">
            <strong className="text-ink">Adelantos Sweed: {formatMoney(s.advances, cur)}</strong> — incluidos en el compromiso
            del mes pero no son consumo. Gasto de consumo pagado sin adelantos:{' '}
            <strong className="text-ink">{formatMoney(s.consumptionActual, cur)}</strong>.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {BLOCKS.map((b) => {
          const bs = s.byBlock[b]
          const meta = BLOCK_META[b]
          return (
            <Card key={b}>
              <CardTitle
                action={
                  <Link href={`/carga?bloque=${b}`} className="text-xs font-medium text-accent hover:underline">
                    Cargar
                  </Link>
                }
              >
                {meta.label} <span className="font-normal text-muted">· {meta.currency}</span>
              </CardTitle>
              <p className="text-xl font-semibold">
                <Money cents={bs.native.budget[meta.currency]} currency={meta.currency} />
              </p>
              <p className="mb-3 text-xs text-muted">
                presupuestado · ≈ {formatMoney(bs.budget, cur)}
              </p>
              <ProgressBar value={bs.actual} max={bs.budget} label={`Ejecutado ${meta.label}`} />
              <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <dt className="text-muted">Real</dt>
                  <dd className="font-medium"><Money cents={bs.actual} currency={cur} /></dd>
                </div>
                <div>
                  <dt className="text-muted">Pendiente</dt>
                  <dd className="font-medium"><Money cents={bs.pending} currency={cur} /></dd>
                </div>
                <div>
                  <dt className="text-muted">Pagados</dt>
                  <dd className="font-medium tabular">{bs.paidCount}/{bs.itemCount}</dd>
                </div>
              </dl>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <CardTitle>Presupuestado vs. Real por bloque · {cur}</CardTitle>
          <GroupedBarChart
            data={blockChart}
            xKey="bloque"
            currency={cur}
            series={[
              { key: 'budget', label: 'Presupuestado', color: 'var(--s1)' },
              { key: 'actual', label: 'Real pagado', color: 'var(--s2)' },
            ]}
          />
        </Card>
        <Card>
          <CardTitle>Evolución mensual · {cur}</CardTitle>
          <TrendLineChart
            data={history}
            xKey="mes"
            currency={cur}
            series={[
              { key: 'income', label: 'Ingreso', color: 'var(--s3)' },
              { key: 'committed', label: 'Comprometido', color: 'var(--s1)' },
              { key: 'actual', label: 'Real pagado', color: 'var(--s2)' },
            ]}
          />
        </Card>
      </div>

      <p className="flex items-start gap-1.5 text-xs text-muted">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        Cada total se suma exacto por moneda y se convierte una sola vez con los tipos de cambio de {monthLabel(currentMonth.id)}.
        Compromiso = presupuesto de cada ítem, o lo pagado si se pasó.
      </p>
    </div>
  )
}
