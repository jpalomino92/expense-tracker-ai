'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useFinance } from '@/context/finance-context'
import { planRouting, type RoutingBasis } from '@/lib/calc'
import { CURRENCIES } from '@/constants/catalog'
import { formatMoney, formatRate } from '@/lib/money'
import { monthLabel } from '@/lib/months'
import { Card, CardTitle, Money, Segmented } from '@/components/ui/primitives'

function Step({ label, children, emphasis }: { label: React.ReactNode; children: React.ReactNode; emphasis?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border py-2 text-sm last:border-0">
      <span className="text-ink-2">{label}</span>
      <span className={emphasis ? 'text-base font-semibold' : 'font-medium'}>{children}</span>
    </div>
  )
}

function Callout({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  const Icon = ok ? CheckCircle2 : AlertTriangle
  return (
    <p className="mt-3 flex items-start gap-2 rounded-xl bg-surface-2 p-3 text-sm">
      <Icon className={ok ? 'mt-0.5 size-4 shrink-0 text-good' : 'mt-0.5 size-4 shrink-0 text-bad'} />
      <span>{children}</span>
    </p>
  )
}

export default function RuteoPage() {
  const { currentMonth } = useFinance()
  const [basis, setBasis] = useState<RoutingBasis>('budget')
  const plan = useMemo(() => planRouting(currentMonth, basis), [currentMonth, basis])
  const { argentina: ar, spain: es, rates } = plan

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Ruteo de cuentas · {monthLabel(currentMonth.id)}</h1>
          <p className="text-xs text-muted tabular">
            1 USD = {formatRate(rates.usdArs, 2)} ARS · 1 USD = {formatRate(rates.usdEur)} EUR
          </p>
        </div>
        <Segmented<RoutingBasis>
          label="Base de cálculo"
          value={basis}
          onChange={setBasis}
          options={[
            { value: 'budget', label: 'Presupuesto total' },
            { value: 'pending', label: 'Solo pendiente' },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>🇦🇷 Argentina (ARS)</CardTitle>
          <Step label={basis === 'budget' ? 'Total a pagar en Argentina' : 'Pendiente en Argentina'} emphasis>
            <Money cents={ar.totalArs} currency="ARS" />
          </Step>
          <Step label="Ingreso Nexup disponible">
            <Money cents={ar.nexupArs} currency="ARS" />
          </Step>
          <Step label="Cubierto con Nexup">
            <Money cents={ar.coveredByNexupArs} currency="ARS" />
          </Step>
          <Step label="Falta cubrir">
            <Money cents={ar.gapArs} currency="ARS" />
          </Step>
          <Step label={<span className="inline-flex items-center gap-1">Enviar desde Harry <ArrowRight className="size-3.5" /> Argentina</span>} emphasis>
            <Money cents={ar.harryToArgentinaUsd} currency="USD" />
          </Step>
          {ar.gapArs > 0 ? (
            <Callout ok={es.harryUsd >= ar.harryToArgentinaUsd}>
              Total {formatMoney(ar.totalArs, 'ARS')} → cubierto con Nexup ({formatMoney(ar.coveredByNexupArs, 'ARS')}) + enviar
              desde Harry <strong>{formatMoney(ar.harryToArgentinaUsd, 'USD')}</strong> (redondeado hacia arriba).
            </Callout>
          ) : (
            <Callout ok>
              Nexup cubre todo Argentina. Sobran <strong>{formatMoney(ar.nexupSurplusArs, 'ARS')}</strong> en pesos.
            </Callout>
          )}
        </Card>

        <Card>
          <CardTitle>🇪🇸 España + Fondos (EUR)</CardTitle>
          <Step label="España">
            <Money cents={es.esEur} currency="EUR" />
          </Step>
          <Step label="Fondos / Sinking funds">
            <Money cents={es.fondosEur} currency="EUR" />
          </Step>
          <Step label={basis === 'budget' ? 'Total a pagar España + Fondos' : 'Pendiente España + Fondos'} emphasis>
            <Money cents={es.totalEur} currency="EUR" />
          </Step>
          <Step label="Sweed">
            <Money cents={es.sweedUsd} currency="USD" />
          </Step>
          <Step label={<span className="inline-flex items-center gap-1">Harry restante <ArrowRight className="size-3.5" /> Wise</span>}>
            <Money cents={es.harryToWiseUsd} currency="USD" tone={es.harryToWiseUsd < 0} />
          </Step>
          <Step label="Disponible en EUR" emphasis>
            <Money cents={es.availableEur} currency="EUR" />
          </Step>
          <Callout ok={es.balanceEur >= 0}>
            {es.balanceEur >= 0 ? 'Sobran ' : 'Faltan '}
            <strong>{formatMoney(Math.abs(es.balanceEur), 'EUR')}</strong> después de cubrir España + Fondos
            {es.harryToWiseUsd < 0 && ' — Harry no alcanza para cubrir Argentina'}.
          </Callout>
        </Card>
      </div>

      <Card>
        <CardTitle>Por cuenta de pago ("Pagado por")</CardTitle>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted">
                <th className="py-2 font-medium">Cuenta</th>
                {CURRENCIES.map((c) => (
                  <th key={c} className="py-2 text-right font-medium">{c}</th>
                ))}
                <th className="py-2 text-right font-medium">Total ≈ EUR</th>
              </tr>
            </thead>
            <tbody>
              {plan.bySource.map((row) => (
                <tr key={row.source} className="border-b border-border last:border-0">
                  <td className="py-2 font-medium">{row.source}</td>
                  {CURRENCIES.map((c) => (
                    <td key={c} className="py-2 text-right text-ink-2">
                      {row.native[c] ? <Money cents={row.native[c]} currency={c} /> : <span className="text-muted">—</span>}
                    </td>
                  ))}
                  <td className="py-2 text-right font-semibold"><Money cents={row.eur} currency="EUR" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
