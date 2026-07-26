import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { idCol, syncCols } from "./_shared";
import { currencies } from "./currencies";
import { transactions } from "./transactions";

export const goalStatusValues = ["active", "completed", "archived"] as const;

export const savingsGoals = sqliteTable("savings_goals", {
  id: idCol(),
  name: text("name").notNull(),
  currencyId: text("currency_id")
    .notNull()
    .references(() => currencies.id),
  targetAmountMinor: integer("target_amount_minor").notNull(),
  targetDate: integer("target_date"),
  icon: text("icon"),
  color: text("color"),
  status: text("status", { enum: goalStatusValues }).notNull().default("active"),
  ...syncCols(),
});

export const goalContributions = sqliteTable(
  "goal_contributions",
  {
    id: idCol(),
    goalId: text("goal_id")
      .notNull()
      .references(() => savingsGoals.id),
    transactionId: text("transaction_id")
      .notNull()
      .references(() => transactions.id),
    amountMinor: integer("amount_minor").notNull(), // denormalized copy of the tx amount for fast progress sums
    ...syncCols(),
  },
  (t) => ({
    goalIdx: index("goal_contributions_goal_idx").on(t.goalId),
    txIdx: index("goal_contributions_tx_idx").on(t.transactionId),
  })
);
