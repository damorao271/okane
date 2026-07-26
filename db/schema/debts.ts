import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { idCol, syncCols } from "./_shared";
import { accounts } from "./accounts";
import { currencies } from "./currencies";
import { transactions } from "./transactions";

export const contacts = sqliteTable("contacts", {
  id: idCol(),
  name: text("name").notNull(),
  phone: text("phone"),
  notes: text("notes"),
  ...syncCols(),
});

// direction: money the user is owed ('receivable') vs money the user owes ('payable')
export const debtDirectionValues = ["receivable", "payable"] as const;
export const debtStatusValues = ["pending", "partially_paid", "paid", "overdue"] as const;

export const debts = sqliteTable(
  "debts",
  {
    id: idCol(),
    contactId: text("contact_id").references(() => contacts.id), // nullable: allow free-text counterparty below
    counterpartyName: text("counterparty_name"), // fallback when no contact chosen
    direction: text("direction", { enum: debtDirectionValues }).notNull(),
    accountId: text("account_id")
      .notNull()
      .references(() => accounts.id), // account whose balance this debt affects
    currencyId: text("currency_id")
      .notNull()
      .references(() => currencies.id),
    principalAmountMinor: integer("principal_amount_minor").notNull(),
    dueDate: integer("due_date"),
    status: text("status", { enum: debtStatusValues }).notNull().default("pending"),
    description: text("description"),
    // creating a debt moves money immediately: 'payable' = income into accountId,
    // 'receivable' = expense out of accountId
    initialTransactionId: text("initial_transaction_id")
      .notNull()
      .references(() => transactions.id),
    ...syncCols(),
  },
  (t) => ({
    contactIdx: index("debts_contact_idx").on(t.contactId),
    statusIdx: index("debts_status_idx").on(t.status),
  })
);

export const debtPayments = sqliteTable(
  "debt_payments",
  {
    id: idCol(),
    debtId: text("debt_id")
      .notNull()
      .references(() => debts.id),
    // every payment is a real movement of money: expense for a payable payment
    // (paying back), income for a receivable payment (getting repaid)
    transactionId: text("transaction_id")
      .notNull()
      .references(() => transactions.id),
    amountMinor: integer("amount_minor").notNull(),
    paidAt: integer("paid_at").notNull(),
    ...syncCols(),
  },
  (t) => ({
    debtIdx: index("debt_payments_debt_idx").on(t.debtId),
  })
);
