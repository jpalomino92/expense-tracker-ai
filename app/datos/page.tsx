'use client'

import { useRef, useState } from 'react'
import { Download, FileJson, FileSpreadsheet, RotateCcw, Trash2, Upload } from 'lucide-react'
import { useFinance } from '@/context/finance-context'
import { CSV_COLUMNS, csvToExpenses, downloadFile, monthToCsv } from '@/lib/csv'
import { monthLabel } from '@/lib/months'
import { createSeedState } from '@/lib/seed'
import { InvalidDataError, parseState } from '@/lib/storage'
import { Button, Card, CardTitle, Segmented } from '@/components/ui/primitives'

type Message = { kind: 'ok' | 'error'; text: string } | null

/** Confirmación en dos pasos sin diálogos del navegador. */
function ConfirmButton({ label, confirmLabel, onConfirm, icon }: {
  label: string; confirmLabel: string; onConfirm: () => void; icon: React.ReactNode
}) {
  const [armed, setArmed] = useState(false)
  return armed ? (
    <span className="inline-flex gap-2">
      <Button variant="danger" className="border border-bad" onClick={() => { onConfirm(); setArmed(false) }}>
        {confirmLabel}
      </Button>
      <Button variant="ghost" onClick={() => setArmed(false)}>Cancelar</Button>
    </span>
  ) : (
    <Button onClick={() => setArmed(true)}>{icon}{label}</Button>
  )
}

export default function DatosPage() {
  const { state, dispatch, currentMonth } = useFinance()
  const [msg, setMsg] = useState<Message>(null)
  const [csvMode, setCsvMode] = useState<'append' | 'replace'>('append')
  const jsonRef = useRef<HTMLInputElement>(null)
  const csvRef = useRef<HTMLInputElement>(null)
  const stamp = new Date().toISOString().slice(0, 10)

  const exportJson = () =>
    downloadFile(JSON.stringify(state, null, 2), `finanzas-familia-backup-${stamp}.json`, 'application/json')

  const exportCsv = () =>
    downloadFile(monthToCsv(currentMonth), `gastos-${currentMonth.id}.csv`, 'text/csv;charset=utf-8')

  const importJson = async (file: File) => {
    try {
      const next = parseState(JSON.parse(await file.text()))
      dispatch({ type: 'replace', state: next })
      setMsg({ kind: 'ok', text: `Backup importado: ${next.months.length} meses, ${next.holdings.length} activos.` })
    } catch (err) {
      const detail = err instanceof InvalidDataError || err instanceof SyntaxError ? err.message : String(err)
      setMsg({ kind: 'error', text: `No se importó nada. ${detail}` })
    }
  }

  const importCsv = async (file: File) => {
    if (currentMonth.locked) {
      setMsg({ kind: 'error', text: 'El mes está cerrado: reabrilo para importar.' })
      return
    }
    const { items, errors } = csvToExpenses(await file.text())
    if (errors.length) {
      setMsg({ kind: 'error', text: `No se importó nada. ${errors.slice(0, 5).join(' · ')}${errors.length > 5 ? ` (+${errors.length - 5})` : ''}` })
      return
    }
    dispatch({ type: 'importExpenses', monthId: currentMonth.id, items, mode: csvMode })
    setMsg({ kind: 'ok', text: `${items.length} ítems ${csvMode === 'append' ? 'agregados a' : 'reemplazaron'} ${monthLabel(currentMonth.id)}.` })
  }

  const pick = (ref: React.RefObject<HTMLInputElement | null>) => ref.current?.click()

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Datos, backups e importación</h1>

      {msg && (
        <p role="status" className={msg.kind === 'ok' ? 'rounded-xl bg-surface-2 p-3 text-sm text-good' : 'rounded-xl bg-surface-2 p-3 text-sm text-bad'}>
          {msg.text}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle><span className="inline-flex items-center gap-2"><FileJson className="size-4" /> Backup completo (JSON)</span></CardTitle>
          <p className="mb-4 text-sm text-ink-2">
            Todos los meses, tipos de cambio, ingresos, gastos y portafolio. Importar <strong>reemplaza</strong> todo
            (se valida antes: si algo está mal, no se toca nada).
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={exportJson}><Download className="size-4" /> Exportar backup</Button>
            <Button onClick={() => pick(jsonRef)}><Upload className="size-4" /> Importar backup</Button>
            <input ref={jsonRef} type="file" accept="application/json,.json" hidden onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) importJson(f)
              e.target.value = ''
            }} />
          </div>
        </Card>

        <Card>
          <CardTitle><span className="inline-flex items-center gap-2"><FileSpreadsheet className="size-4" /> Gastos de {monthLabel(currentMonth.id)} (CSV)</span></CardTitle>
          <p className="mb-2 text-sm text-ink-2">Columnas: <code className="text-xs">{CSV_COLUMNS.join(', ')}</code></p>
          <p className="mb-4 text-xs text-muted">
            bloque = ES / AR / FONDOS · moneda = EUR / USD / ARS · montos tipo 1267.50 o 1.267,50 · fijo/adelanto = si/no ·
            estado se ignora al importar (se calcula solo).
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" onClick={exportCsv}><Download className="size-4" /> Exportar CSV</Button>
            <Segmented
              label="Modo de importación"
              size="sm"
              value={csvMode}
              onChange={setCsvMode}
              options={[{ value: 'append', label: 'Agregar' }, { value: 'replace', label: 'Reemplazar' }]}
            />
            <Button onClick={() => pick(csvRef)}><Upload className="size-4" /> Importar CSV</Button>
            <input ref={csvRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) importCsv(f)
              e.target.value = ''
            }} />
          </div>
        </Card>

        <Card>
          <CardTitle>Meses</CardTitle>
          <p className="mb-4 text-sm text-ink-2">
            Eliminar {monthLabel(currentMonth.id)} borra sus ingresos y gastos. Exportá un backup antes.
          </p>
          <ConfirmButton
            label={`Eliminar ${monthLabel(currentMonth.id)}`}
            confirmLabel="Sí, eliminar mes"
            icon={<Trash2 className="size-4" />}
            onConfirm={() => {
              if (state.months.length <= 1) {
                setMsg({ kind: 'error', text: 'Tiene que quedar al menos un mes.' })
                return
              }
              if (currentMonth.locked) {
                setMsg({ kind: 'error', text: 'El mes está cerrado: reabrilo para eliminarlo.' })
                return
              }
              dispatch({ type: 'deleteMonth', monthId: currentMonth.id })
              setMsg({ kind: 'ok', text: `${monthLabel(currentMonth.id)} eliminado.` })
            }}
          />
        </Card>

        <Card>
          <CardTitle>Semilla inicial</CardTitle>
          <p className="mb-4 text-sm text-ink-2">
            Vuelve a los datos de ejemplo (Oct 2026 – Ene 2027). Reemplaza <strong>todo</strong> lo guardado.
          </p>
          <ConfirmButton
            label="Restaurar semilla"
            confirmLabel="Sí, borrar todo y restaurar"
            icon={<RotateCcw className="size-4" />}
            onConfirm={() => {
              dispatch({ type: 'replace', state: createSeedState() })
              setMsg({ kind: 'ok', text: 'Semilla restaurada.' })
            }}
          />
        </Card>
      </div>
    </div>
  )
}
