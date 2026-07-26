export type CurrencyLike = {
  symbol: string;
  decimals: number;
};

export function toMinorUnits(input: string, decimals: number): number {
  const normalized = input.replace(",", ".").trim();
  const major = Number.parseFloat(normalized || "0");
  if (!Number.isFinite(major)) return 0;
  return Math.round(major * 10 ** decimals);
}

export function formatMinor(amountMinor: number, currency: CurrencyLike): string {
  const major = amountMinor / 10 ** currency.decimals;
  const formatted = major.toLocaleString("es-VE", {
    minimumFractionDigits: currency.decimals,
    maximumFractionDigits: currency.decimals,
  });
  return `${currency.symbol} ${formatted}`;
}

export type ExchangeRateLike = {
  rateScaled: number;
  rateScale: number;
};

/**
 * amountMinor is denominated in the currency with `decimals`. `rate` is
 * "quote-currency minor units per 1 base-currency major unit" (see
 * db/schema/currencies.ts), where the base currency is the one `amountMinor`
 * is in and the quote currency is USD.
 */
export function convertMinorToUsdCents(
  amountMinor: number,
  decimals: number,
  rate: ExchangeRateLike
): number {
  const majorAmount = amountMinor / 10 ** decimals;
  return Math.round(majorAmount * (rate.rateScaled / rate.rateScale));
}
