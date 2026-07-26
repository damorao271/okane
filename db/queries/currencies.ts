import { asc, isNull } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { db } from "@/db/client";
import { currencies, rateTypeValues } from "@/db/schema";
import { DEFAULT_CURRENCY_IDS } from "@/db/seed";

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
