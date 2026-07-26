import type { AccountType } from '@/db/schema'

export type Institution = {
  id: string
  name: string
  type: AccountType
  /** Domain used to fetch a real favicon/logo. Absent for generic entries like "Efectivo". */
  domain?: string
  /** Ionicons fallback glyph for entries with no domain. */
  icon?: string
  color: string
}

const NEUTRAL = '#6b7280'

// Ordered by market share (activos totales / captaciones del público).
export const NATIONAL_INSTITUTIONS: Institution[] = [
  {
    id: 'efectivo',
    name: 'Efectivo',
    type: 'cash',
    icon: 'cash-outline',
    color: '#22c55e',
  },
  {
    id: 'bdv',
    name: 'Banco de Venezuela',
    type: 'bank',
    domain: 'bancodevenezuela.com',
    color: NEUTRAL,
  },
  {
    id: 'bnc',
    name: 'Banco Nacional de Crédito',
    type: 'bank',
    domain: 'bncenlinea.com',
    color: NEUTRAL,
  },
  {
    id: 'provincial',
    name: 'BBVA Provincial',
    type: 'bank',
    domain: 'provincial.com',
    color: NEUTRAL,
  },
  {
    id: 'banesco',
    name: 'Banesco',
    type: 'bank',
    domain: 'banesco.com',
    color: NEUTRAL,
  },
  {
    id: 'mercantil',
    name: 'Mercantil Banco',
    type: 'bank',
    domain: 'mercantilbanco.com',
    color: NEUTRAL,
  },
  {
    id: 'bt',
    name: 'Banco del Tesoro',
    type: 'bank',
    domain: 'bt.gob.ve',
    color: NEUTRAL,
  },
  {
    id: 'bancamiga',
    name: 'Bancamiga',
    type: 'bank',
    domain: 'bancamiga.com',
    color: NEUTRAL,
  },
  {
    id: 'banplus',
    name: 'Banplus',
    type: 'bank',
    domain: 'banplus.com',
    color: NEUTRAL,
  },
  {
    id: 'bancaribe',
    name: 'Bancaribe',
    type: 'bank',
    domain: 'bancaribe.com.ve',
    color: NEUTRAL,
  },
  {
    id: 'vencred',
    name: 'Venezolano de Crédito',
    type: 'bank',
    domain: 'vencred.com',
    color: NEUTRAL,
  },
  {
    id: 'bancoplaza',
    name: 'Banco Plaza',
    type: 'bank',
    domain: 'bancoplaza.com',
    color: NEUTRAL,
  },
  {
    id: 'bfc',
    name: 'Banco Fondo Común (BFC)',
    type: 'bank',
    domain: 'bfc.com.ve',
    color: NEUTRAL,
  },
]

export const INTERNATIONAL_INSTITUTIONS: Institution[] = [
  {
    id: 'binance',
    name: 'Binance',
    type: 'crypto_wallet',
    domain: 'binance.com',
    color: NEUTRAL,
  },
  {
    id: 'bofa',
    name: 'Bank of America',
    type: 'bank',
    domain: 'bankofamerica.com',
    color: NEUTRAL,
  },
  {
    id: 'zinli',
    name: 'Zinli',
    type: 'bank',
    domain: 'zinli.com',
    color: NEUTRAL,
  },
  {
    id: 'facebank',
    name: 'Facebank',
    type: 'bank',
    domain: 'facebank.pr',
    color: NEUTRAL,
  },
  {
    id: 'eldorado',
    name: 'El Dorado',
    type: 'crypto_wallet',
    domain: 'dorado.io',
    color: NEUTRAL,
  },
  {
    id: 'banesco-panama',
    name: 'Banesco Panamá',
    type: 'bank',
    domain: 'banesco.com.pa',
    color: NEUTRAL,
  },
  {
    id: 'mercantil-panama',
    name: 'Mercantil Banco Panamá',
    type: 'bank',
    domain: 'mercantilbanco.com.pa',
    color: NEUTRAL,
  },
  {
    id: 'payoneer',
    name: 'Payoneer',
    type: 'bank',
    domain: 'payoneer.com',
    color: NEUTRAL,
  },
  {
    id: 'paypal',
    name: 'PayPal',
    type: 'bank',
    domain: 'paypal.com',
    color: NEUTRAL,
  },
  {
    id: 'pyypl',
    name: 'Pyypl',
    type: 'bank',
    domain: 'pyypl.com',
    color: NEUTRAL,
  },
  {
    id: 'wise',
    name: 'Wise',
    type: 'bank',
    domain: 'wise.com',
    color: NEUTRAL,
  },
  {
    id: 'airtm',
    name: 'Airtm',
    type: 'bank',
    domain: 'airtm.com',
    color: NEUTRAL,
  },
]
