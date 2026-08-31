import { and, eq, isNull } from 'drizzle-orm'
import { db } from './client'
import { categories, currencies, exchangeRates } from './schema'

// Fixed (not random) UUIDs for the well-known default currencies, so every fresh
// install — and a future sync server — agree on the same ids for these rows.
export const DEFAULT_CURRENCY_IDS = {
  VES: '00000000-0000-4000-8000-000000000001',
  USD: '00000000-0000-4000-8000-000000000002',
  USDT: '00000000-0000-4000-8000-000000000003',
  // Informational only (BCV EUR/VES rate) — no accounts use this currency,
  // so it's never fed into pickLatestUsdRate's USD-hub conversion engine.
  EUR: '00000000-0000-4000-8000-000000000004',
} as const

const DEFAULT_CURRENCIES = [
  {
    id: DEFAULT_CURRENCY_IDS.VES,
    code: 'VES',
    name: 'Bolívar',
    symbol: 'Bs',
    decimals: 2,
    isCrypto: false,
    sortOrder: 0,
  },
  {
    id: DEFAULT_CURRENCY_IDS.USD,
    code: 'USD',
    name: 'Dólar',
    symbol: '$',
    decimals: 2,
    isCrypto: false,
    sortOrder: 1,
  },
  {
    id: DEFAULT_CURRENCY_IDS.USDT,
    code: 'USDT',
    name: 'Tether',
    symbol: '₮',
    decimals: 2,
    isCrypto: true,
    sortOrder: 2,
  },
  {
    id: DEFAULT_CURRENCY_IDS.EUR,
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    decimals: 2,
    isCrypto: false,
    sortOrder: 3,
  },
]

// Static placeholder rates (Bs per $1) until a settings screen lets the user
// update them. rateScaled = USD cents per 1 unit of the base currency.
export const RATE_SCALE = 1_000_000
export const bsPerUsdToRateScaled = (bsPerUsd: number) =>
  Math.round((100 / bsPerUsd) * RATE_SCALE)

const DEFAULT_EXCHANGE_RATES = [
  {
    baseCurrencyId: DEFAULT_CURRENCY_IDS.VES,
    quoteCurrencyId: DEFAULT_CURRENCY_IDS.USD,
    rateType: 'bcv' as const,
    rateScaled: bsPerUsdToRateScaled(700),
    source: 'seed:static',
  },
  {
    baseCurrencyId: DEFAULT_CURRENCY_IDS.VES,
    quoteCurrencyId: DEFAULT_CURRENCY_IDS.USD,
    rateType: 'parallel' as const,
    rateScaled: bsPerUsdToRateScaled(800),
    source: 'seed:static',
  },
  {
    baseCurrencyId: DEFAULT_CURRENCY_IDS.VES,
    quoteCurrencyId: DEFAULT_CURRENCY_IDS.USD,
    rateType: 'manual' as const,
    rateScaled: bsPerUsdToRateScaled(1000),
    source: 'seed:static',
  },
  {
    baseCurrencyId: DEFAULT_CURRENCY_IDS.USDT,
    quoteCurrencyId: DEFAULT_CURRENCY_IDS.USD,
    rateType: 'manual' as const,
    rateScaled: 100 * RATE_SCALE, // 1 USDT = 1 USD = 100 cents
    source: 'seed:stablecoin',
  },
]

type DefaultCategory = {
  name: string
  icon: string
  color: string
  subcategories?: { name: string; icon: string }[]
}

// Subcategories inherit their parent's color — only icon is per-subcategory.
const DEFAULT_EXPENSE_CATEGORIES: DefaultCategory[] = [
  {
    name: 'Hogar',
    icon: 'home-outline',
    color: '#eab308',
    subcategories: [
      { name: 'Condominio', icon: 'business-outline' },
      { name: 'Servicios', icon: 'flash-outline' },
      { name: 'Reparaciones', icon: 'hammer-outline' },
      { name: 'Limpieza', icon: 'water-outline' },
      { name: 'Herramientas', icon: 'construct-outline' },
      { name: 'Utencilios', icon: 'restaurant-outline' },
      { name: 'Linea Blanca', icon: 'cube-outline' },
    ],
  },
  {
    name: 'Mercado',
    icon: 'cart-outline',
    color: '#f97316',
    subcategories: [
      { name: 'Proteina', icon: 'nutrition-outline' },
      { name: 'Vegetales y Frutas', icon: 'leaf-outline' },
      { name: 'Condimentos y Salsas', icon: 'flask-outline' },
      { name: 'Pan y Harinas', icon: 'layers-outline' },
      { name: 'Dulces', icon: 'ice-cream-outline' },
      { name: 'Granos', icon: 'basket-outline' },
      { name: 'Lacteos', icon: 'cafe-outline' },
      { name: 'Charcuteria', icon: 'fast-food-outline' },
      { name: 'Bebidas', icon: 'wine-outline' },
    ],
  },
  {
    name: 'Carro',
    icon: 'car-sport-outline',
    color: '#0ea5e9',
    subcategories: [
      { name: 'Mecanica', icon: 'construct-outline' },
      { name: 'Repuestos', icon: 'cog-outline' },
      { name: 'Aceite', icon: 'water-outline' },
      { name: 'Refrigerante', icon: 'thermometer-outline' },
      { name: 'Aditivos', icon: 'flask-outline' },
      { name: 'Autolavado', icon: 'sparkles-outline' },
      { name: 'Accesorios', icon: 'pricetag-outline' },
      { name: 'Seguro', icon: 'shield-checkmark-outline' },
    ],
  },
  {
    name: 'Transporte',
    icon: 'bus-outline',
    color: '#0891b2',
    subcategories: [
      { name: 'Gasolina', icon: 'speedometer-outline' },
      { name: 'Estacionamiento', icon: 'location-outline' },
      { name: 'Bus', icon: 'bus-outline' },
      { name: 'Metro', icon: 'subway-outline' },
      { name: 'Yummy', icon: 'bicycle-outline' },
    ],
  },
  {
    name: 'Salud',
    icon: 'heart-outline',
    color: '#ef4444',
    subcategories: [
      { name: 'Consultas', icon: 'medical-outline' },
      { name: 'Medicinas', icon: 'medkit-outline' },
      { name: 'Tratamientos', icon: 'bandage-outline' },
      { name: 'Vitaminas', icon: 'nutrition-outline' },
      { name: 'Terapias', icon: 'pulse-outline' },
    ],
  },
  {
    name: 'Seguro Medico',
    icon: 'shield-checkmark-outline',
    color: '#047857',
  },
  {
    name: 'Educación',
    icon: 'school-outline',
    color: '#3b82f6',
    subcategories: [
      { name: 'Cursos', icon: 'ribbon-outline' },
      { name: 'Libros', icon: 'book-outline' },
      { name: 'Útiles', icon: 'pencil-outline' },
      { name: 'Clases', icon: 'people-outline' },
      { name: 'Certificaciones', icon: 'school-outline' },
      { name: 'Fotocopias', icon: 'copy-outline' },
    ],
  },
  {
    name: 'Tecnología y Comunicaciones',
    icon: 'phone-portrait-outline',
    color: '#06b6d4',
    subcategories: [
      { name: 'Recargas Telefónicas', icon: 'call-outline' },
      { name: 'Suscripciones Digitales', icon: 'play-circle-outline' },
      { name: 'Gadgets y Equipos', icon: 'laptop-outline' },
      { name: 'Servicios', icon: 'settings-outline' },
    ],
  },
  {
    name: 'Subscripciones y Streaming',
    icon: 'tv-outline',
    color: '#dc2626',
    subcategories: [
      { name: 'Netflix', icon: 'film-outline' },
      { name: 'Spotify', icon: 'musical-notes-outline' },
      { name: 'Patreon', icon: 'star-outline' },
      { name: 'Amazon Prime', icon: 'cube-outline' },
      { name: 'HBO', icon: 'videocam-outline' },
    ],
  },
  {
    name: 'IA',
    icon: 'hardware-chip-outline',
    color: '#6366f1',
    subcategories: [
      { name: 'Cursor', icon: 'code-slash-outline' },
      { name: 'Claude', icon: 'chatbubble-ellipses-outline' },
      { name: 'Gemini', icon: 'sparkles-outline' },
    ],
  },
  {
    name: 'Finanzas, Comisiones y Tasas',
    icon: 'cash-outline',
    color: '#10b981',
    subcategories: [
      { name: 'Comisiones Bancarias', icon: 'card-outline' },
      { name: 'Diferencial Cambiario', icon: 'swap-horizontal-outline' },
      { name: 'Pago de Deudas / Tarjetas', icon: 'wallet-outline' },
      { name: 'Ahorro e Inversión', icon: 'trending-up-outline' },
    ],
  },
  {
    name: 'Salidas',
    icon: 'people-outline',
    color: '#ec4899',
    subcategories: [
      { name: 'Amigos', icon: 'happy-outline' },
      { name: 'Familia', icon: 'people-circle-outline' },
      { name: 'Pareja', icon: 'heart-outline' },
      { name: 'Yo', icon: 'person-outline' },
      { name: 'Delivery', icon: 'fast-food-outline' },
    ],
  },
  {
    name: 'Fitness',
    icon: 'barbell-outline',
    color: '#65a30d',
    subcategories: [
      { name: 'Crossfit', icon: 'fitness-outline' },
      { name: 'Suplementos', icon: 'nutrition-outline' },
      { name: 'Equipos', icon: 'barbell-outline' },
      { name: 'Clases', icon: 'people-outline' },
    ],
  },
  {
    name: 'Higiene',
    icon: 'sparkles-outline',
    color: '#c026d3',
    subcategories: [
      { name: 'Corte de pelo', icon: 'cut-outline' },
      { name: 'Cremas', icon: 'flask-outline' },
      { name: 'Jabon y Shampoo', icon: 'water-outline' },
      { name: 'Articulos', icon: 'basket-outline' },
    ],
  },
  {
    name: 'Regalos',
    icon: 'gift-outline',
    color: '#fb7185',
    subcategories: [
      { name: 'Pareja', icon: 'heart-outline' },
      { name: 'Familia', icon: 'people-circle-outline' },
      { name: 'Donaciones', icon: 'hand-left-outline' },
    ],
  },
  {
    name: 'Viajes',
    icon: 'airplane-outline',
    color: '#1d4ed8',
    subcategories: [
      { name: 'Boletos', icon: 'ticket-outline' },
      { name: 'Hotel o Posada', icon: 'bed-outline' },
      { name: 'Alquiler Vehiculo', icon: 'car-outline' },
      { name: 'Transporte publico', icon: 'bus-outline' },
      { name: 'Estacionamientos y Peajes', icon: 'location-outline' },
      { name: 'Restaurantes', icon: 'restaurant-outline' },
      { name: 'Mercado', icon: 'cart-outline' },
      { name: 'Tours', icon: 'compass-outline' },
      { name: 'Actividades', icon: 'walk-outline' },
      { name: 'Conectividad', icon: 'wifi-outline' },
      { name: 'Souvenirs', icon: 'gift-outline' },
      { name: 'Compras Personales', icon: 'bag-outline' },
    ],
  },
  {
    name: 'Mascotas',
    icon: 'paw-outline',
    color: '#a16207',
    subcategories: [
      { name: 'Comida', icon: 'fish-outline' },
      { name: 'Veterinario', icon: 'medical-outline' },
      { name: 'Vacunas', icon: 'bandage-outline' },
      { name: 'Juguetes', icon: 'football-outline' },
      { name: 'Medicamentos', icon: 'medkit-outline' },
      { name: 'Higiene', icon: 'water-outline' },
    ],
  },
  {
    name: 'Negocio / Trabajo Independiente',
    icon: 'briefcase-outline',
    color: '#8b5cf6',
    subcategories: [
      { name: 'Herramientas de Trabajo', icon: 'hammer-outline' },
      { name: 'Inventarios / Insumos', icon: 'cube-outline' },
      { name: 'Envíos y Logística', icon: 'paper-plane-outline' },
    ],
  },
]

const DEFAULT_INCOME_CATEGORIES: DefaultCategory[] = [
  { name: 'Salario', icon: 'cash-outline', color: '#22c55e' },
  { name: 'Freelance', icon: 'laptop-outline', color: '#3b82f6' },
  { name: 'Regalo', icon: 'gift-outline', color: '#ec4899' },
  {
    name: 'Otros ingresos',
    icon: 'ellipsis-horizontal-outline',
    color: '#9ca3af',
  },
]

async function seedCurrencies() {
  for (const currency of DEFAULT_CURRENCIES) {
    const existing = await db.query.currencies.findFirst({
      where: eq(currencies.id, currency.id),
    })
    if (!existing) {
      await db.insert(currencies).values(currency)
    }
  }
}

async function seedCategoryGroup(
  type: 'expense' | 'income',
  groups: DefaultCategory[],
) {
  const existingRoots = await db.query.categories.findMany({
    where: and(
      eq(categories.isDefault, true),
      eq(categories.type, type),
      isNull(categories.parentCategoryId),
    ),
  })
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i]
    let root = existingRoots.find((c) => c.name === group.name)
    if (!root) {
      const [inserted] = await db
        .insert(categories)
        .values({
          name: group.name,
          type,
          icon: group.icon,
          color: group.color,
          isDefault: true,
          sortOrder: i,
        })
        .returning()
      root = inserted
    }
    if (!group.subcategories?.length) continue

    const existingChildren = await db.query.categories.findMany({
      where: eq(categories.parentCategoryId, root.id),
    })
    const existingChildNames = new Set(existingChildren.map((c) => c.name))

    const childrenToInsert = (group.subcategories ?? [])
      .map((sub, j) => ({
        name: sub.name,
        type,
        icon: sub.icon,
        color: group.color,
        parentCategoryId: root!.id,
        isDefault: true,
        sortOrder: j,
      }))
      .filter((c) => !existingChildNames.has(c.name))

    if (childrenToInsert.length > 0) {
      await db.insert(categories).values(childrenToInsert)
    }
  }
}

async function seedCategories() {
  await seedCategoryGroup('expense', DEFAULT_EXPENSE_CATEGORIES)
  await seedCategoryGroup('income', DEFAULT_INCOME_CATEGORIES)
}

async function seedExchangeRates() {
  for (const rate of DEFAULT_EXCHANGE_RATES) {
    const existing = await db.query.exchangeRates.findFirst({
      where: and(
        eq(exchangeRates.baseCurrencyId, rate.baseCurrencyId),
        eq(exchangeRates.quoteCurrencyId, rate.quoteCurrencyId),
        eq(exchangeRates.rateType, rate.rateType),
      ),
    })
    if (!existing) {
      await db.insert(exchangeRates).values({
        ...rate,
        rateScale: RATE_SCALE,
        effectiveAt: Date.now(),
      })
    }
  }
}

// One-off historical backfill (Aug 18–27 2026) transcribed from BCV/Binance
// P2P screenshots the user provided, so the "Histórico" chart has real data
// to plot instead of a single placeholder point. Guarded by a unique
// `source` tag so — like the rest of this file — it only ever inserts once.
const HISTORICAL_BACKFILL_SOURCE = 'seed:historical-2026-08'
const HISTORICAL_YEAR = 2026
const HISTORICAL_MONTH_INDEX = 7 // August

const HISTORICAL_BCV_USD_VES = [
  { day: 18, bsPerUsd: 773.31 },
  { day: 19, bsPerUsd: 775.34 },
  { day: 20, bsPerUsd: 777.42 },
  { day: 21, bsPerUsd: 779.95 },
  { day: 24, bsPerUsd: 784.66 },
  { day: 25, bsPerUsd: 785.07 },
  { day: 26, bsPerUsd: 787.52 },
  { day: 27, bsPerUsd: 791.32 },
]

const HISTORICAL_BCV_EUR_VES = [
  { day: 18, bsPerEur: 896.03 },
  { day: 19, bsPerEur: 897.82 },
  { day: 20, bsPerEur: 906.83 },
  { day: 21, bsPerEur: 911.22 },
  { day: 24, bsPerEur: 916.01 },
  { day: 25, bsPerEur: 916.03 },
  { day: 26, bsPerEur: 919.15 },
  { day: 27, bsPerEur: 921.81 },
]

const HISTORICAL_PARALLEL_USDT_VES = [
  { day: 20, bsPerUsdt: 918.19 },
  { day: 21, bsPerUsdt: 919.5 },
  { day: 22, bsPerUsdt: 919.05 },
  { day: 23, bsPerUsdt: 919.51 },
  { day: 24, bsPerUsdt: 926.56 },
  { day: 25, bsPerUsdt: 943.0 },
  { day: 26, bsPerUsdt: 953.0 },
  { day: 27, bsPerUsdt: 940.0 },
]

const HISTORICAL_LAST_DAY = 27

// Days land at noon, except the most recent day, which lands at 23:59:59 —
// later than the `DEFAULT_EXCHANGE_RATES` seed above (timestamped with the
// real `Date.now()` from whenever the app first ran, always earlier the same
// calendar day), so this real data — not the 700/800 placeholders — wins as
// "today's" rate in `useRateVariation`/`useRateHistory`'s latest-by-day pick.
function historicalTimestamp(day: number): number {
  if (day === HISTORICAL_LAST_DAY) {
    return new Date(HISTORICAL_YEAR, HISTORICAL_MONTH_INDEX, day, 23, 59, 59).getTime()
  }
  return new Date(HISTORICAL_YEAR, HISTORICAL_MONTH_INDEX, day, 12, 0, 0).getTime()
}

async function seedHistoricalRates() {
  const alreadySeeded = await db.query.exchangeRates.findFirst({
    where: eq(exchangeRates.source, HISTORICAL_BACKFILL_SOURCE),
  })
  if (alreadySeeded) return

  const rows = [
    ...HISTORICAL_BCV_USD_VES.map(({ day, bsPerUsd }) => ({
      baseCurrencyId: DEFAULT_CURRENCY_IDS.VES,
      quoteCurrencyId: DEFAULT_CURRENCY_IDS.USD,
      rateType: 'bcv' as const,
      rateScaled: bsPerUsdToRateScaled(bsPerUsd),
      rateScale: RATE_SCALE,
      effectiveAt: historicalTimestamp(day),
      source: HISTORICAL_BACKFILL_SOURCE,
    })),
    ...HISTORICAL_BCV_EUR_VES.map(({ day, bsPerEur }) => ({
      baseCurrencyId: DEFAULT_CURRENCY_IDS.EUR,
      quoteCurrencyId: DEFAULT_CURRENCY_IDS.VES,
      rateType: 'bcv' as const,
      rateScaled: Math.round(bsPerEur * 100 * RATE_SCALE),
      rateScale: RATE_SCALE,
      effectiveAt: historicalTimestamp(day),
      source: HISTORICAL_BACKFILL_SOURCE,
    })),
    ...HISTORICAL_PARALLEL_USDT_VES.map(({ day, bsPerUsdt }) => ({
      baseCurrencyId: DEFAULT_CURRENCY_IDS.VES,
      quoteCurrencyId: DEFAULT_CURRENCY_IDS.USD,
      rateType: 'parallel' as const,
      rateScaled: bsPerUsdToRateScaled(bsPerUsdt),
      rateScale: RATE_SCALE,
      effectiveAt: historicalTimestamp(day),
      source: HISTORICAL_BACKFILL_SOURCE,
    })),
  ]

  await db.insert(exchangeRates).values(rows)
}

export async function seedDatabase() {
  await seedCurrencies()
  await seedCategories()
  await seedExchangeRates()
  await seedHistoricalRates()
}
