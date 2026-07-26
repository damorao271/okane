import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { idCol, syncCols } from "./_shared";
import { currencies } from "./currencies";

export const accountTypeValues = ["cash", "bank", "crypto_wallet", "other"] as const;
export type AccountType = (typeof accountTypeValues)[number];

export const accounts = sqliteTable(
  "accounts",
  {
    id: idCol(),
    name: text("name").notNull(),
    // optional free-text tag shown alongside the name (e.g. "familiar"), independent
    // of the institution/name — not used for icon/favicon lookup.
    label: text("label"),
    type: text("type", { enum: accountTypeValues }).notNull().default("cash"),
    currencyId: text("currency_id")
      .notNull()
      .references(() => currencies.id),
    icon: text("icon"),
    color: text("color"),
    // cached running balance in the account's own currency, minor units. Derived from
    // transactions, recomputed in the same write within a DB transaction.
    balanceMinor: integer("balance_minor").notNull().default(0),
    isArchived: integer("is_archived", { mode: "boolean" }).notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    ...syncCols(),
  },
  (t) => ({
    currencyIdx: index("accounts_currency_idx").on(t.currencyId),
  })
);
