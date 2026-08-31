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

export type UsdRate = { rateScaled: number; rateScale: number; effectiveAt: number };

/** All exchange-rate rows, live. Use with `pickLatestUsdRate` to avoid calling hooks in a loop. */
export function useExchangeRates() {
  return useLiveQuery(db.query.exchangeRates.findMany());
}

/**
 * Latest rate from `currencyId` to USD among `rates` — whichever row (of any
 * rateType) was most recently recorded wins, so a fresh bcv/parallel fetch always
 * beats a stale manual rate. Ties (same `effectiveAt`) fall back to manual > parallel > bcv.
 */
export function pickLatestUsdRate(
  rates: { baseCurrencyId: string; quoteCurrencyId: string; rateType: string; effectiveAt: number; rateScaled: number; rateScale: number }[],
  currencyId: string
): UsdRate | null {
  if (currencyId === DEFAULT_CURRENCY_IDS.USD) {
    // 1 USD major unit = 100 USD cents (quote-minor-units-per-base-major-unit).
    return { rateScaled: 100_000_000, rateScale: 1_000_000, effectiveAt: Date.now() };
  }
  const rows = rates.filter(
    (r) => r.baseCurrencyId === currencyId && r.quoteCurrencyId === DEFAULT_CURRENCY_IDS.USD
  );
  if (rows.length === 0) return null;

  const maxEffectiveAt = Math.max(...rows.map((r) => r.effectiveAt));
  const latestRows = rows.filter((r) => r.effectiveAt === maxEffectiveAt);
  if (latestRows.length === 1) return latestRows[0];

  for (const rateType of RATE_TYPE_PRIORITY) {
    const match = latestRows.find((r) => r.rateType === rateType);
    if (match) return match;
  }
  return latestRows[0];
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

export type RateRow = {
  baseCurrencyId: string;
  quoteCurrencyId: string;
  rateType: string;
  effectiveAt: number;
  rateScaled: number;
  rateScale: number;
};

/**
 * The `exchange_rates` table stores both the official USD rate and the
 * Binance-sourced USDT rate as the same (baseCurrencyId=VES,
 * quoteCurrencyId=USD) pair, distinguished only by `rateType` — "bcv"/"manual"
 * are the USD series, "parallel" is actually Binance P2P USDT/VES data (see
 * `refreshExchangeRates`). USD and USDT must each stick to their own series;
 * picking "whichever is most recent" across both would let a fresh USDT
 * fetch masquerade as the USD rate (or vice versa).
 */
const VES_RATE_TYPES_BY_CURRENCY: Record<string, readonly string[]> = {
  [DEFAULT_CURRENCY_IDS.USD]: ["manual", "bcv"],
  [DEFAULT_CURRENCY_IDS.USDT]: ["parallel"],
};

/** Latest row among `rows`, tie-broken by the order of `typePriority` on same-timestamp rows. */
function pickLatestByType<T extends { rateType: string; effectiveAt: number }>(
  rows: T[],
  typePriority: readonly string[]
): T | null {
  if (rows.length === 0) return null;
  const maxEffectiveAt = Math.max(...rows.map((r) => r.effectiveAt));
  const latest = rows.filter((r) => r.effectiveAt === maxEffectiveAt);
  if (latest.length === 1) return latest[0];
  for (const type of typePriority) {
    const match = latest.find((r) => r.rateType === type);
    if (match) return match;
  }
  return latest[0];
}

/**
 * Bs (VES major units) equivalent to 1 major unit of `currencyId`, or null if
 * there isn't enough rate data yet. EUR is stored directly against VES (see
 * `useLatestBcvEurRate`); USD and USDT each resolve to their own series within
 * the shared VES/USD table (see `VES_RATE_TYPES_BY_CURRENCY`).
 */
export function getVesMajorPerUnit(rates: RateRow[], currencyId: string): number | null {
  if (currencyId === DEFAULT_CURRENCY_IDS.VES) return 1;

  if (currencyId === DEFAULT_CURRENCY_IDS.EUR) {
    const rows = rates
      .filter(
        (r) =>
          r.baseCurrencyId === DEFAULT_CURRENCY_IDS.EUR &&
          r.quoteCurrencyId === DEFAULT_CURRENCY_IDS.VES &&
          r.rateType === "bcv"
      )
      .sort((a, b) => b.effectiveAt - a.effectiveAt);
    if (rows.length === 0) return null;
    return rows[0].rateScaled / rows[0].rateScale / 100;
  }

  const allowedTypes = VES_RATE_TYPES_BY_CURRENCY[currencyId];
  if (allowedTypes) {
    const rows = rates.filter(
      (r) =>
        r.baseCurrencyId === DEFAULT_CURRENCY_IDS.VES &&
        r.quoteCurrencyId === DEFAULT_CURRENCY_IDS.USD &&
        allowedTypes.includes(r.rateType)
    );
    const chosen = pickLatestByType(rows, allowedTypes);
    if (!chosen) return null;
    // chosen.rateScaled/rateScale = USD-cents per 1 VES-major (base=VES, quote=USD).
    return 100 / (chosen.rateScaled / chosen.rateScale);
  }

  const unitToUsd = pickLatestUsdRate(rates, currencyId);
  const vesToUsd = pickLatestUsdRate(rates, DEFAULT_CURRENCY_IDS.VES);
  if (!unitToUsd || !vesToUsd) return null;
  const usdMajorPerUnit = unitToUsd.rateScaled / unitToUsd.rateScale / 100;
  const vesMajorPerUsdMajor = 100 / (vesToUsd.rateScaled / vesToUsd.rateScale);
  return usdMajorPerUnit * vesMajorPerUsdMajor;
}

/** Timestamp of the rate backing `getVesMajorPerUnit(rates, currencyId)`, or null for VES (no rate needed) / no data yet. */
export function getVesRateEffectiveAt(rates: RateRow[], currencyId: string): number | null {
  if (currencyId === DEFAULT_CURRENCY_IDS.VES) return null;

  if (currencyId === DEFAULT_CURRENCY_IDS.EUR) {
    const rows = rates.filter(
      (r) =>
        r.baseCurrencyId === DEFAULT_CURRENCY_IDS.EUR &&
        r.quoteCurrencyId === DEFAULT_CURRENCY_IDS.VES &&
        r.rateType === "bcv"
    );
    if (rows.length === 0) return null;
    return Math.max(...rows.map((r) => r.effectiveAt));
  }

  const allowedTypes = VES_RATE_TYPES_BY_CURRENCY[currencyId];
  if (allowedTypes) {
    const rows = rates.filter(
      (r) =>
        r.baseCurrencyId === DEFAULT_CURRENCY_IDS.VES &&
        r.quoteCurrencyId === DEFAULT_CURRENCY_IDS.USD &&
        allowedTypes.includes(r.rateType)
    );
    return pickLatestByType(rows, allowedTypes)?.effectiveAt ?? null;
  }

  return pickLatestUsdRate(rates, currencyId)?.effectiveAt ?? null;
}

/** Converts `amountMinor` (in `from`'s minor units) into `to`'s minor units, pivoting through VES. */
export function convertBetweenCurrencies(
  rates: RateRow[],
  from: { id: string; decimals: number },
  to: { id: string; decimals: number },
  amountMinor: number
): number | null {
  if (from.id === to.id) return amountMinor;
  const fromVesPerUnit = getVesMajorPerUnit(rates, from.id);
  const toVesPerUnit = getVesMajorPerUnit(rates, to.id);
  if (fromVesPerUnit === null || toVesPerUnit === null) return null;
  const amountMajor = amountMinor / 10 ** from.decimals;
  const vesMajor = amountMajor * fromVesPerUnit;
  const toMajor = vesMajor / toVesPerUnit;
  return Math.round(toMajor * 10 ** to.decimals);
}

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
