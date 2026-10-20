'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { ArrowLeftRight, ChevronLeft, ChevronRight, Database, LayoutDashboard, ListChecks, Lock, Moon, Sun, Wallet } from 'lucide-react'
import { useFinance } from '@/context/finance-context'
import { monthLabel, sortMonths } from '@/lib/months'
import { Segmented, cn } from '@/components/ui/primitives'

const NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/carga', label: 'Carga', icon: ListChecks },
  { href: '/ruteo', label: 'Ruteo', icon: ArrowLeftRight },
  { href: '/portafolio', label: 'Portafolio', icon: Wallet },
  { href: '/datos', label: 'Datos', icon: Database },
]

function ThemeToggle() {
  const [dark, setDark] = useState(false)
  useEffect(() => setDark(document.documentElement.classList.contains('dark')), [])
  const toggle = () => {
    const next = !dark
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('finanzas-familia:theme', next ? 'dark' : 'light')
    } catch {}
    setDark(next)
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      className="grid size-9 place-items-center rounded-lg text-ink-2 hover:bg-surface-2"
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  )
}

function MonthSwitcher() {
  const { state, dispatch, currentMonth } = useFinance()
  const months = sortMonths(state.months)
  const idx = months.findIndex((m) => m.id === currentMonth.id)
  const go = (i: number) => months[i] && dispatch({ type: 'selectMonth', monthId: months[i].id })

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label="Mes anterior"
        disabled={idx <= 0}
        onClick={() => go(idx - 1)}
        className="grid size-8 place-items-center rounded-lg text-ink-2 hover:bg-surface-2 disabled:opacity-30"
      >
        <ChevronLeft className="size-4" />
      </button>
      <label className="relative">
        <span className="sr-only">Mes</span>
        <select
          value={currentMonth.id}
          onChange={(e) => dispatch({ type: 'selectMonth', monthId: e.target.value })}
          className="h-8 appearance-none rounded-lg bg-transparent px-2 text-sm font-semibold text-ink hover:bg-surface-2"
        >
          {months.map((m) => (
            <option key={m.id} value={m.id}>
              {monthLabel(m.id)}
            </option>
          ))}
        </select>
      </label>
      {currentMonth.locked && <Lock aria-label="Mes cerrado" className="size-3.5 text-muted" />}
      <button
        type="button"
        aria-label="Mes siguiente"
        disabled={idx >= months.length - 1}
        onClick={() => go(idx + 1)}
        className="grid size-8 place-items-center rounded-lg text-ink-2 hover:bg-surface-2 disabled:opacity-30"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { state, dispatch } = useFinance()
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  return (
    <div className="min-h-dvh pb-20 md:pb-8">
      <header className="sticky top-0 z-20 border-b border-border bg-page/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="grid size-7 place-items-center rounded-lg bg-accent text-xs font-bold text-accent-ink">FF</span>
            <span className="hidden sm:inline">Finanzas Familia</span>
          </Link>
          <MonthSwitcher />
          <div className="flex items-center gap-1">
            <Segmented
              label="Moneda de visualización"
              size="sm"
              value={state.displayCurrency}
              onChange={(currency) => dispatch({ type: 'setDisplay', currency })}
              options={[
                { value: 'EUR', label: 'EUR' },
                { value: 'USD', label: 'USD' },
              ]}
            />
            <ThemeToggle />
          </div>
        </div>
        <nav aria-label="Secciones" className="mx-auto hidden max-w-6xl gap-1 px-4 pb-2 md:flex">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? 'page' : undefined}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium',
                isActive(href) ? 'bg-surface-2 text-ink' : 'text-muted hover:text-ink',
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-4 sm:py-6">{children}</main>

      <nav
        aria-label="Secciones"
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(href) ? 'page' : undefined}
            className={cn(
              'flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium',
              isActive(href) ? 'text-accent' : 'text-muted',
            )}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
