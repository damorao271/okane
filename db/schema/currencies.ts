import { relations } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { idCol, syncCols } from "./_shared";

export const currencies = sqliteTable(
  "currencies",
  {
    id: idCol(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    symbol: text("symbol").notNull(),
    decimals: integer("decimals").notNull().default(2),
    isCrypto: integer("is_crypto", { mode: "boolean" }).notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    ...syncCols(),
  },
  (t) => ({
    codeUq: uniqueIndex("currencies_code_uq").on(t.code),
  })
);

export const rateTypeValues = ["bcv", "parallel", "manual"] as const;

export const exchangeRates = sqliteTable(
  "exchange_rates",
  {
    id: idCol(),
    baseCurrencyId: text("base_currency_id")
      .notNull()
      .references(() => currencies.id),
    quoteCurrencyId: text("quote_currency_id")
      .notNull()
      .references(() => currencies.id),
    rateType: text("rate_type", { enum: rateTypeValues }).notNull().default("manual"),
    // rate = quote-currency minor units per 1 base-currency unit, fixed-point scaled to avoid floats
    rateScaled: integer("rate_scaled").notNull(),
    rateScale: integer("rate_scale").notNull().default(1000000),
    effectiveAt: integer("effective_at").notNull(),
    source: text("source"),
    ...syncCols(),
  },
  (t) => ({
    lookupIdx: index("exchange_rates_lookup_idx").on(
      t.baseCurrencyId,
      t.quoteCurrencyId,
      t.rateType,
      t.effectiveAt
    ),
  })
);

export const currenciesRelations = relations(currencies, ({ many }) => ({
  ratesAsBase: many(exchangeRates, { relationName: "baseCurrency" }),
  ratesAsQuote: many(exchangeRates, { relationName: "quoteCurrency" }),
}));

export const exchangeRatesRelations = relations(exchangeRates, ({ one }) => ({
  baseCurrency: one(currencies, {
    fields: [exchangeRates.baseCurrencyId],
    references: [currencies.id],
    relationName: "baseCurrency",
  }),
  quoteCurrency: one(currencies, {
    fields: [exchangeRates.quoteCurrencyId],
    references: [currencies.id],
    relationName: "quoteCurrency",
  }),
}));
