import { eq } from "drizzle-orm";
import { db } from "./client";
import { categories, currencies } from "./schema";

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

export async function seedDatabase() {
  await seedCurrencies();
  await seedCategories();
}
