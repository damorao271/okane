import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { idCol, syncCols } from "./_shared";
import { categories } from "./categories";
import { currencies } from "./currencies";

export const budgets = sqliteTable(
  "budgets",
  {
    id: idCol(),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id),
    currencyId: text("currency_id")
      .notNull()
      .references(() => currencies.id),
    limitMinor: integer("limit_minor").notNull(),
    // explicit period range (not an implicit "current month" flag) so a budget always
    // remains historically reproducible, and new/edited budgets per month are just new rows
    periodStart: integer("period_start").notNull(),
    periodEnd: integer("period_end").notNull(),
    ...syncCols(),
  },
  (t) => ({
    categoryPeriodUq: uniqueIndex("budgets_category_period_uq").on(t.categoryId, t.periodStart),
  })
);
