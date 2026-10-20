import type { Metadata, Viewport } from 'next'
import { FinanceProvider } from '@/context/finance-context'
import { AppShell } from '@/components/app-shell'
import './globals.css'

export const metadata: Metadata = {
  title: 'Finanzas Familia',
  description: 'Presupuesto vs. Real multimoneda (USD · EUR · ARS)',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f6f3' },
    { media: '(prefers-color-scheme: dark)', color: '#0d0d0d' },
  ],
}

// Aplica el tema guardado (o el del sistema) antes de pintar, sin parpadeo.
const themeScript = `try{var t=localStorage.getItem('finanzas-familia:theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh font-sans antialiased">
        <FinanceProvider>
          <AppShell>{children}</AppShell>
        </FinanceProvider>
      </body>
    </html>
  )
}
