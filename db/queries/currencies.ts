import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { db } from "@/db/client";
import { currencies, exchangeRates, rateTypeValues } from "@/db/schema";
import { DEFAULT_CURRENCY_IDS, RATE_SCALE, bsPerUsdToRateScaled } from "@/db/seed";
import { fetchBcvRates } from "@/lib/rates/bcv";
import { fetchBinanceUsdtVesRate } from "@/lib/rates/binanceP2P";

export function useCurrencies() {
  return useLiveQuery(
    db.query.currencies.findMany({
      where: isNull(currencies.deletedAt),
      orderBy: [asc(currencies.sortOrder)],
    })
  );
}

const RATE_TYPE_PRIORITY = [
  "manual",
  "parallel",
  "bcv",
] as const satisfies readonly (typeof rateTypeValues)[number][];

export type UsdRate = { rateScaled: number; rateScale: number };

/** All exchange-rate rows, live. Use with `pickLatestUsdRate` to avoid calling hooks in a loop. */
export function useExchangeRates() {
  return useLiveQuery(db.query.exchangeRates.findMany());
}

/** Latest rate from `currencyId` to USD among `rates`, preferring manual > parallel > bcv. */
export function pickLatestUsdRate(
  rates: { baseCurrencyId: string; quoteCurrencyId: string; rateType: string; effectiveAt: number; rateScaled: number; rateScale: number }[],
  currencyId: string
): UsdRate | null {
  if (currencyId === DEFAULT_CURRENCY_IDS.USD) {
    // 1 USD major unit = 100 USD cents (quote-minor-units-per-base-major-unit).
    return { rateScaled: 100_000_000, rateScale: 1_000_000 };
  }
  for (const rateType of RATE_TYPE_PRIORITY) {
    const rows = rates.filter(
      (r) =>
        r.baseCurrencyId === currencyId &&
        r.quoteCurrencyId === DEFAULT_CURRENCY_IDS.USD &&
        r.rateType === rateType
    );
    if (rows.length > 0) {
      return rows.reduce((latest, r) => (r.effectiveAt > latest.effectiveAt ? r : latest));
    }
  }
  return null;
}

/** Convenience hook for a single currency (e.g. one account row). */
export function useLatestRateToUsd(currencyId: string | undefined) {
  const { data, error } = useExchangeRates();
  const rate = currencyId ? pickLatestUsdRate(data, currencyId) : null;
  return { rate, error };
}

/**
 * Latest BCV EUR/VES rate, informational only — deliberately bypasses
 * `pickLatestUsdRate` (see AGENTS.md: EUR has no accounts, so it's stored as
 * baseCurrencyId=EUR, quoteCurrencyId=VES directly, not through the USD hub).
 */
export function useLatestBcvEurRate() {
  return useLiveQuery(
    db.query.exchangeRates.findFirst({
      where: and(
        eq(exchangeRates.baseCurrencyId, DEFAULT_CURRENCY_IDS.EUR),
        eq(exchangeRates.quoteCurrencyId, DEFAULT_CURRENCY_IDS.VES),
        eq(exchangeRates.rateType, "bcv")
      ),
      orderBy: [desc(exchangeRates.effectiveAt)],
    })
  );
}

type RateRow = {
  baseCurrencyId: string;
  quoteCurrencyId: string;
  rateType: string;
  effectiveAt: number;
  rateScaled: number;
  rateScale: number;
};

function startOfDay(timestamp: number): number {
  const d = new Date(timestamp);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Bs per 1 unit of the base currency, for rows stored the "inverted" way (base=VES, quote=USD). */
function bsPerUnitFromVesBaseRow(row: RateRow): number {
  return 100 / (row.rateScaled / row.rateScale);
}

/** Bs per 1 unit of the base currency, for rows stored direct (base=EUR, quote=VES). */
function bsPerUnitFromDirectRow(row: RateRow): number {
  return row.rateScaled / row.rateScale / 100;
}

export type RateVariation = {
  code: "USD" | "EUR" | "USDT";
  label: string;
  today: number | null;
  yesterday: number | null;
  percentChange: number | null;
};

const VARIATION_FEEDS: {
  code: RateVariation["code"];
  label: string;
  baseCurrencyId: string;
  quoteCurrencyId: string;
  rateType: string;
  toBsPerUnit: (row: RateRow) => number;
}[] = [
  {
    code: "USD",
    label: "USD / VES",
    baseCurrencyId: DEFAULT_CURRENCY_IDS.VES,
    quoteCurrencyId: DEFAULT_CURRENCY_IDS.USD,
    rateType: "bcv",
    toBsPerUnit: bsPerUnitFromVesBaseRow,
  },
  {
    code: "EUR",
    label: "EUR / VES",
    baseCurrencyId: DEFAULT_CURRENCY_IDS.EUR,
    quoteCurrencyId: DEFAULT_CURRENCY_IDS.VES,
    rateType: "bcv",
    toBsPerUnit: bsPerUnitFromDirectRow,
  },
  {
    code: "USDT",
    label: "USDT / VES",
    baseCurrencyId: DEFAULT_CURRENCY_IDS.VES,
    quoteCurrencyId: DEFAULT_CURRENCY_IDS.USD,
    rateType: "parallel",
    toBsPerUnit: bsPerUnitFromVesBaseRow,
  },
];

/**
 * "Hoy" vs "ayer" (previous calendar day) for each of the three published
 * rates, plus % change — powers the "Tasas de cambio" screen.
 */
export function useRateVariation(): RateVariation[] {
  const { data: rates } = useExchangeRates();

  return VARIATION_FEEDS.map((feed) => {
    const rows = rates
      .filter(
        (r) =>
          r.baseCurrencyId === feed.baseCurrencyId &&
          r.quoteCurrencyId === feed.quoteCurrencyId &&
          r.rateType === feed.rateType
      )
      .sort((a, b) => b.effectiveAt - a.effectiveAt);

    if (rows.length === 0) {
      return { code: feed.code, label: feed.label, today: null, yesterday: null, percentChange: null };
    }

    const todayRow = rows[0];
    const todayDay = startOfDay(todayRow.effectiveAt);
    const yesterdayRow = rows.find((r) => startOfDay(r.effectiveAt) < todayDay) ?? null;

    const today = feed.toBsPerUnit(todayRow);
    const yesterday = yesterdayRow ? feed.toBsPerUnit(yesterdayRow) : null;
    const percentChange = yesterday ? ((today - yesterday) / yesterday) * 100 : null;

    return { code: feed.code, label: feed.label, today, yesterday, percentChange };
  });
}

export type RateHistoryDay = {
  dayStart: number;
  values: Partial<Record<RateVariation["code"], number>>;
};

/** One row per calendar day, most recent first — the latest value of each feed that day. */
export function useRateHistory(): RateHistoryDay[] {
  const { data: rates } = useExchangeRates();

  const days = new Map<number, RateHistoryDay>();
  for (const feed of VARIATION_FEEDS) {
    const rows = rates
      .filter(
        (r) =>
          r.baseCurrencyId === feed.baseCurrencyId &&
          r.quoteCurrencyId === feed.quoteCurrencyId &&
          r.rateType === feed.rateType
      )
      // Ascending, so the last write per day below ends up being that day's latest sample.
      .sort((a, b) => a.effectiveAt - b.effectiveAt);
    for (const row of rows) {
      const dayStart = startOfDay(row.effectiveAt);
      const day = days.get(dayStart) ?? { dayStart, values: {} };
      day.values[feed.code] = feed.toBsPerUnit(row);
      days.set(dayStart, day);
    }
  }

  return Array.from(days.values()).sort((a, b) => b.dayStart - a.dayStart);
}

/**
 * Fetches BCV (USD, EUR) and Binance P2P (USDT/VES "parallel") rates and
 * appends them to `exchange_rates` — never updates/deletes existing rows,
 * per the table's append-only design. Each source is independent: one
 * failing (site down, markup changed, no ads returned) must not block the
 * other or throw the whole refresh into an error state.
 */
export async function refreshExchangeRates(): Promise<void> {
  const now = Date.now();

  const bcvResult = await fetchBcvRates().catch((error) => {
    console.warn("BCV rate refresh failed:", error);
    return null;
  });

  if (bcvResult) {
    await db.insert(exchangeRates).values([
      {
        baseCurrencyId: DEFAULT_CURRENCY_IDS.VES,
        quoteCurrencyId: DEFAULT_CURRENCY_IDS.USD,
        rateType: "bcv",
        rateScaled: bsPerUsdToRateScaled(bcvResult.usdVesRate),
        rateScale: RATE_SCALE,
        effectiveAt: now,
        source: "bcv.org.ve",
      },
      {
        baseCurrencyId: DEFAULT_CURRENCY_IDS.EUR,
        quoteCurrencyId: DEFAULT_CURRENCY_IDS.VES,
        rateType: "bcv",
        // Direct — VES-cents per 1 EUR — no inversion needed (informational only).
        rateScaled: Math.round(bcvResult.eurVesRate * 100 * RATE_SCALE),
        rateScale: RATE_SCALE,
        effectiveAt: now,
        source: "bcv.org.ve",
      },
    ]);
  }

  const binanceRate = await fetchBinanceUsdtVesRate().catch((error) => {
    console.warn("Binance P2P rate refresh failed:", error);
    return null;
  });

  if (binanceRate) {
    await db.insert(exchangeRates).values({
      baseCurrencyId: DEFAULT_CURRENCY_IDS.VES,
      quoteCurrencyId: DEFAULT_CURRENCY_IDS.USD,
      rateType: "parallel",
      rateScaled: bsPerUsdToRateScaled(binanceRate),
      rateScale: RATE_SCALE,
      effectiveAt: now,
      source: "binance-p2p",
    });
  }
}
