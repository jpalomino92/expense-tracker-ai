'use client'

import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { Currency, Holding, HoldingKind } from '@/types/finance'
import { useFinance } from '@/context/finance-context'
import { summarizePortfolio } from '@/lib/calc'
import { monthLabel, newId } from '@/lib/months'
import { CURRENCIES, HOLDING_KINDS, PLATFORMS } from '@/constants/catalog'
import { HorizontalBars } from '@/components/charts'
import { Button, Card, CardTitle, EmptyState, Money, MoneyInput, Segmented, Select, cn, inputClass } from '@/components/ui/primitives'

type KindFilter = 'todos' | HoldingKind

function HoldingRow({ h }: { h: Holding }) {
  const { dispatch } = useFinance()
  const save = (patch: Partial<Holding>) => dispatch({ type: 'upsertHolding', holding: { ...h, ...patch } })
  const [asset, setAsset] = useState<string | null>(null)
  const [qty, setQty] = useState<string | null>(null)

  return (
    <li className="grid grid-cols-2 items-center gap-2 border-b border-border py-3 last:border-0 sm:grid-cols-[8rem_1fr_8rem_7rem_5rem_9rem_2rem]">
      <Select label="Plataforma" value={h.platform} options={[...new Set([...PLATFORMS, h.platform])]} onChange={(platform) => save({ platform })} />
      <input
        aria-label="Activo"
        value={asset ?? h.asset}
        onChange={(e) => setAsset(e.target.value)}
        onBlur={() => {
          if (asset?.trim()) save({ asset: asset.trim() })
          setAsset(null)
        }}
        className={cn(inputClass, 'font-medium')}
      />
      <Select<HoldingKind>
        label="Tipo"
        value={h.kind}
        options={Object.entries(HOLDING_KINDS).map(([value, label]) => ({ value: value as HoldingKind, label }))}
        onChange={(kind) => save({ kind })}
      />
      <input
        aria-label={`Cantidad de ${h.asset}`}
        inputMode="decimal"
        placeholder="Cantidad"
        value={qty ?? (h.quantity ? String(h.quantity) : '')}
        onChange={(e) => setQty(e.target.value)}
        onBlur={() => {
          if (qty !== null) {
            const n = Number(qty.replace(',', '.'))
            if (Number.isFinite(n) && n >= 0) save({ quantity: n })
          }
          setQty(null)
        }}
        className={cn(inputClass, 'tabular text-right')}
      />
      <Select<Currency> label="Moneda" value={h.currency} options={CURRENCIES} onChange={(currency) => save({ currency })} />
      <MoneyInput label={`Valor actual de ${h.asset}`} cents={h.value} currency={h.currency} onCommit={(value) => save({ value })} />
      <button
        type="button"
        aria-label={`Eliminar ${h.asset}`}
        onClick={() => dispatch({ type: 'deleteHolding', id: h.id })}
        className="grid size-8 place-items-center justify-self-end rounded-lg text-muted hover:text-bad"
      >
        <Trash2 className="size-4" />
      </button>
    </li>
  )
}

export default function PortafolioPage() {
  const { state, dispatch, currentMonth } = useFinance()
  const [filter, setFilter] = useState<KindFilter>('todos')
  const cur = state.displayCurrency
  const p = useMemo(() => summarizePortfolio(state.holdings, cur, currentMonth.rates), [state.holdings, cur, currentMonth.rates])
  const holdings = state.holdings.filter((h) => filter === 'todos' || h.kind === filter)
  const volatileShare = p.total > 0 ? Math.round((p.volatile / p.total) * 100) : 0

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Portafolio de inversión y patrimonio</h1>
        <p className="text-xs text-muted">
          Convertido con los tipos de cambio de {monthLabel(currentMonth.id)}
          {state.portfolioUpdatedAt && ` · actualizado ${new Date(state.portfolioUpdatedAt).toLocaleString('es-AR')}`}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card>
          <p className="text-xs font-medium text-muted">Patrimonio total</p>
          <p className="text-2xl font-semibold"><Money cents={p.total} currency={cur} /></p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-muted">Portafolio volátil (cripto + acciones)</p>
          <p className="text-2xl font-semibold"><Money cents={p.volatile} currency={cur} /></p>
          <p className="text-xs text-ink-2">{volatileShare}% del total</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-muted">Liquidez disponible (fondo de emergencia)</p>
          <p className="text-2xl font-semibold"><Money cents={p.liquidity} currency={cur} /></p>
          <p className="text-xs text-ink-2">{p.total > 0 ? 100 - volatileShare : 0}% del total</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <CardTitle>Portafolio volátil por activo · {cur}</CardTitle>
          {p.byAsset.some((a) => a.value > 0) ? (
            <HorizontalBars rows={p.byAsset.filter((a) => a.value > 0).map((a) => ({ label: a.asset, value: a.value }))} currency={cur} />
          ) : (
            <EmptyState>Cargá el valor actual de cada activo para ver la distribución.</EmptyState>
          )}
        </Card>
        <Card>
          <CardTitle>Por plataforma · {cur}</CardTitle>
          {p.byPlatform.some((a) => a.value > 0) ? (
            <HorizontalBars rows={p.byPlatform.filter((a) => a.value > 0).map((a) => ({ label: a.platform, value: a.value }))} currency={cur} />
          ) : (
            <EmptyState>Sin saldos cargados todavía.</EmptyState>
          )}
        </Card>
      </div>

      <Card>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <Segmented<KindFilter>
            label="Tipo de activo"
            size="sm"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'todos', label: 'Todos' },
              { value: 'cripto', label: 'Cripto' },
              { value: 'accion', label: 'Acciones' },
              { value: 'liquidez', label: 'Liquidez' },
            ]}
          />
          <Button
            size="sm"
            onClick={() =>
              dispatch({
                type: 'upsertHolding',
                holding: {
                  id: newId(), platform: 'IBKR', asset: 'NUEVO',
                  kind: filter === 'todos' ? 'accion' : filter, quantity: 0, value: 0, currency: 'USD',
                },
              })
            }
          >
            <Plus className="size-3.5" /> Agregar activo
          </Button>
        </div>
        <div className="hidden grid-cols-[8rem_1fr_8rem_7rem_5rem_9rem_2rem] gap-2 border-b border-border pb-2 text-[11px] font-medium uppercase tracking-wide text-muted sm:grid">
          <span>Plataforma</span><span>Activo</span><span>Tipo</span><span className="text-right">Cantidad</span>
          <span>Moneda</span><span className="text-right">Valor actual</span><span />
        </div>
        {holdings.length ? (
          <ul>{holdings.map((h) => <HoldingRow key={h.id} h={h} />)}</ul>
        ) : (
          <EmptyState>No hay activos de este tipo.</EmptyState>
        )}
      </Card>
    </div>
  )
}
