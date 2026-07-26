import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { idCol, syncCols } from "./_shared";
import { currencies } from "./currencies";
import { transactions } from "./transactions";

export const shoppingListStatusValues = ["open", "completed", "archived"] as const;

export const shoppingLists = sqliteTable("shopping_lists", {
  id: idCol(),
  name: text("name").notNull(),
  currencyId: text("currency_id")
    .notNull()
    .references(() => currencies.id),
  status: text("status", { enum: shoppingListStatusValues }).notNull().default("open"),
  // set once the list is "completed" and converted into a real expense
  resultingTransactionId: text("resulting_transaction_id").references(() => transactions.id),
  ...syncCols(),
});

export const shoppingListItems = sqliteTable(
  "shopping_list_items",
  {
    id: idCol(),
    listId: text("list_id")
      .notNull()
      .references(() => shoppingLists.id),
    productName: text("product_name").notNull(),
    estimatedUnitPriceMinor: integer("estimated_unit_price_minor"),
    quantity: integer("quantity").notNull().default(1),
    isChecked: integer("is_checked", { mode: "boolean" }).notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    ...syncCols(),
  },
  (t) => ({
    listIdx: index("shopping_list_items_list_idx").on(t.listId),
  })
);
