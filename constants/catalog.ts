import type { BlockId, Currency, FundingSource, HoldingKind, IncomeSource } from '@/types/finance'

export const BLOCK_META: Record<
  BlockId,
  { label: string; short: string; currency: Currency; categories: string[] }
> = {
  ES: {
    label: 'España',
    short: 'ES',
    currency: 'EUR',
    categories: [
      'Vivienda', 'Comida', 'Servicios', 'Salidas', 'Sueldos', 'Salud',
      'Profesionales', 'Impuestos', 'Suscripciones', 'Adelanto Sweed', 'Otros',
    ],
  },
  AR: {
    label: 'Argentina',
    short: 'AR',
    currency: 'ARS',
    categories: [
      'Salud mental', 'Mascotas', 'Tarjetas', 'Deudas', 'Profesionales',
      'Impuestos', 'Auto', 'Otros',
    ],
  },
  FONDOS: {
    label: 'Fondos',
    short: 'Fondos',
    currency: 'EUR',
    categories: ['Sinking fund', 'Emergencia', 'Salud', 'Deporte', 'Otros'],
  },
}

export const CURRENCIES: Currency[] = ['EUR', 'USD', 'ARS']
export const FUNDING_SOURCE_LIST: FundingSource[] = ['Sweed', 'Harry', 'Nexup', 'Galicia', 'Wise']
export const INCOME_SOURCES: IncomeSource[] = ['Sweed', 'Harry', 'Nexup', 'Otro']

export const HOLDING_KINDS: Record<HoldingKind, string> = {
  cripto: 'Cripto',
  accion: 'Acción / ETF',
  liquidez: 'Liquidez',
}

export const PLATFORMS = ['Nexo Juan', 'Nexo Jenn', 'IBKR', 'Wise', 'Banco']
