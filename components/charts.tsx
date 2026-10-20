'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts'
import type { Currency } from '@/types/finance'
import { formatMoney } from '@/lib/money'

/**
 * Colores con significado fijo en todos los gráficos:
 *   s1 = Presupuestado/Comprometido · s2 = Real pagado · s3 = Ingreso
 */
export interface SeriesDef {
  key: string
  label: string
  color: string
}

const axisTick = { fill: 'var(--muted)', fontSize: 11 }

function Legend({ series }: { series: SeriesDef[] }) {
  return (
    <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2">
      {series.map((s) => (
        <li key={s.key} className="inline-flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-sm" style={{ background: s.color }} />
          {s.label}
        </li>
      ))}
    </ul>
  )
}

function ChartTooltip({
  active,
  payload,
  label,
  currency,
  series,
}: TooltipContentProps<number, string> & { currency: Currency; series: SeriesDef[] }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-ink">{label}</p>
      {series.map((s) => {
        const p = payload.find((x) => x.dataKey === s.key)
        if (!p) return null
        return (
          <p key={s.key} className="flex items-center justify-between gap-4 text-ink-2">
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden className="size-2 rounded-sm" style={{ background: s.color }} />
              {s.label}
            </span>
            <span className="tabular font-medium text-ink">{formatMoney(Number(p.value), currency)}</span>
          </p>
        )
      })}
    </div>
  )
}

interface ChartProps {
  data: Array<Record<string, string | number>>
  xKey: string
  series: SeriesDef[]
  currency: Currency
  height?: number
}

export function GroupedBarChart({ data, xKey, series, currency, height = 240 }: ChartProps) {
  return (
    <div>
      <Legend series={series} />
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} barGap={2} barCategoryGap="28%" margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--grid)" />
          <XAxis dataKey={xKey} tick={axisTick} axisLine={{ stroke: 'var(--line)' }} tickLine={false} />
          <YAxis
            tick={axisTick}
            axisLine={false}
            tickLine={false}
            width={64}
            tickFormatter={(v: number) => formatMoney(v, currency, { compact: true })}
          />
          <Tooltip
            cursor={{ fill: 'var(--surface-2)' }}
            content={(props) => <ChartTooltip {...(props as TooltipContentProps<number, string>)} currency={currency} series={series} />}
          />
          {series.map((s) => (
            <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[4, 4, 0, 0]} maxBarSize={36} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function TrendLineChart({ data, xKey, series, currency, height = 240 }: ChartProps) {
  return (
    <div>
      <Legend series={series} />
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--grid)" />
          <XAxis dataKey={xKey} tick={axisTick} axisLine={{ stroke: 'var(--line)' }} tickLine={false} />
          <YAxis
            tick={axisTick}
            axisLine={false}
            tickLine={false}
            width={64}
            tickFormatter={(v: number) => formatMoney(v, currency, { compact: true })}
          />
          <Tooltip
            cursor={{ stroke: 'var(--line)' }}
            content={(props) => <ChartTooltip {...(props as TooltipContentProps<number, string>)} currency={currency} series={series} />}
          />
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 2, stroke: 'var(--surface)', fill: s.color }}
              activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--surface)' }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Barras horizontales de una sola serie (asignación por activo). */
export function HorizontalBars({
  rows,
  currency,
  color = 'var(--s1)',
}: {
  rows: Array<{ label: string; value: number }>
  currency: Currency
  color?: string
}) {
  const max = Math.max(...rows.map((r) => r.value), 1)
  const total = rows.reduce((s, r) => s + r.value, 0)
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[5rem_1fr_auto] items-center gap-3 text-sm" title={`${r.label}: ${formatMoney(r.value, currency)}`}>
          <span className="truncate font-medium">{r.label}</span>
          <span className="h-3 rounded-r bg-surface-2">
            <span className="block h-full rounded-r" style={{ width: `${(r.value / max) * 100}%`, background: color }} />
          </span>
          <span className="tabular text-right text-xs text-ink-2">
            {formatMoney(r.value, currency, { decimals: 0 })}
            <span className="ml-1 text-muted">{total > 0 ? `${((r.value / total) * 100).toFixed(1)}%` : ''}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}
