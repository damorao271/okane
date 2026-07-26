import { and, eq } from "drizzle-orm";
import { db } from "./client";
import { categories, currencies, exchangeRates } from "./schema";

// Fixed (not random) UUIDs for the well-known default currencies, so every fresh
// install — and a future sync server — agree on the same ids for these rows.
export const DEFAULT_CURRENCY_IDS = {
  VES: "00000000-0000-4000-8000-000000000001",
  USD: "00000000-0000-4000-8000-000000000002",
  USDT: "00000000-0000-4000-8000-000000000003",
} as const;

const DEFAULT_CURRENCIES = [
  {
    id: DEFAULT_CURRENCY_IDS.VES,
    code: "VES",
    name: "Bolívar",
    symbol: "Bs",
    decimals: 2,
    isCrypto: false,
    sortOrder: 0,
  },
  {
    id: DEFAULT_CURRENCY_IDS.USD,
    code: "USD",
    name: "Dólar",
    symbol: "$",
    decimals: 2,
    isCrypto: false,
    sortOrder: 1,
  },
  {
    id: DEFAULT_CURRENCY_IDS.USDT,
    code: "USDT",
    name: "Tether",
    symbol: "₮",
    decimals: 2,
    isCrypto: true,
    sortOrder: 2,
  },
];

// Static placeholder rates (Bs per $1) until a settings screen lets the user
// update them. rateScaled = USD cents per 1 unit of the base currency.
const RATE_SCALE = 1_000_000;
const bsPerUsdToRateScaled = (bsPerUsd: number) => Math.round((100 / bsPerUsd) * RATE_SCALE);

const DEFAULT_EXCHANGE_RATES = [
  {
    baseCurrencyId: DEFAULT_CURRENCY_IDS.VES,
    quoteCurrencyId: DEFAULT_CURRENCY_IDS.USD,
    rateType: "bcv" as const,
    rateScaled: bsPerUsdToRateScaled(700),
    source: "seed:static",
  },
  {
    baseCurrencyId: DEFAULT_CURRENCY_IDS.VES,
    quoteCurrencyId: DEFAULT_CURRENCY_IDS.USD,
    rateType: "parallel" as const,
    rateScaled: bsPerUsdToRateScaled(800),
    source: "seed:static",
  },
  {
    baseCurrencyId: DEFAULT_CURRENCY_IDS.VES,
    quoteCurrencyId: DEFAULT_CURRENCY_IDS.USD,
    rateType: "manual" as const,
    rateScaled: bsPerUsdToRateScaled(1000),
    source: "seed:static",
  },
  {
    baseCurrencyId: DEFAULT_CURRENCY_IDS.USDT,
    quoteCurrencyId: DEFAULT_CURRENCY_IDS.USD,
    rateType: "manual" as const,
    rateScaled: 100 * RATE_SCALE, // 1 USDT = 1 USD = 100 cents
    source: "seed:stablecoin",
  },
];

const DEFAULT_EXPENSE_CATEGORIES = [
  "Mercado",
  "Salidas",
  "Servicios",
  "Transporte",
  "Salud",
  "Hogar",
  "Otros",
];

const DEFAULT_INCOME_CATEGORIES = ["Salario", "Freelance", "Regalo", "Otros ingresos"];

async function seedCurrencies() {
  for (const currency of DEFAULT_CURRENCIES) {
    const existing = await db.query.currencies.findFirst({
      where: eq(currencies.id, currency.id),
    });
    if (!existing) {
      await db.insert(currencies).values(currency);
    }
  }
}

async function seedCategories() {
  const existing = await db.query.categories.findMany({
    where: eq(categories.isDefault, true),
  });
  const existingNames = new Set(existing.map((c) => `${c.type}:${c.name}`));

  const toInsert = [
    ...DEFAULT_EXPENSE_CATEGORIES.map((name, i) => ({
      name,
      type: "expense" as const,
      isDefault: true,
      sortOrder: i,
    })),
    ...DEFAULT_INCOME_CATEGORIES.map((name, i) => ({
      name,
      type: "income" as const,
      isDefault: true,
      sortOrder: i,
    })),
  ].filter((c) => !existingNames.has(`${c.type}:${c.name}`));

  if (toInsert.length > 0) {
    await db.insert(categories).values(toInsert);
  }
}

async function seedExchangeRates() {
  for (const rate of DEFAULT_EXCHANGE_RATES) {
    const existing = await db.query.exchangeRates.findFirst({
      where: and(
        eq(exchangeRates.baseCurrencyId, rate.baseCurrencyId),
        eq(exchangeRates.quoteCurrencyId, rate.quoteCurrencyId),
        eq(exchangeRates.rateType, rate.rateType)
      ),
    });
    if (!existing) {
      await db.insert(exchangeRates).values({
        ...rate,
        rateScale: RATE_SCALE,
        effectiveAt: Date.now(),
      });
    }
  }
}

export async function seedDatabase() {
  await seedCurrencies();
  await seedCategories();
  await seedExchangeRates();
}
