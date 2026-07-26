import { relations } from "drizzle-orm";
import { accounts } from "./accounts";
import { budgets } from "./budgets";
import { categories } from "./categories";
import { contacts, debtPayments, debts } from "./debts";
import { currencies } from "./currencies";
import { goalContributions, savingsGoals } from "./goals";
import { shoppingListItems, shoppingLists } from "./shopping";
import { transactions } from "./transactions";

// Kept in one file (rather than colocated per-table) so cross-file table references
// never form an import cycle between e.g. accounts.ts and transactions.ts.

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  currency: one(currencies, { fields: [accounts.currencyId], references: [currencies.id] }),
  transactions: many(transactions),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentCategoryId],
    references: [categories.id],
    relationName: "categoryParent",
  }),
  children: many(categories, { relationName: "categoryParent" }),
  transactions: many(transactions),
  budgets: many(budgets),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  account: one(accounts, { fields: [transactions.accountId], references: [accounts.id] }),
  transferAccount: one(accounts, {
    fields: [transactions.transferAccountId],
    references: [accounts.id],
    relationName: "transferDestination",
  }),
  category: one(categories, { fields: [transactions.categoryId], references: [categories.id] }),
  currency: one(currencies, { fields: [transactions.currencyId], references: [currencies.id] }),
  goalContributions: many(goalContributions),
  debtPayments: many(debtPayments),
}));

export const budgetsRelations = relations(budgets, ({ one }) => ({
  category: one(categories, { fields: [budgets.categoryId], references: [categories.id] }),
  currency: one(currencies, { fields: [budgets.currencyId], references: [currencies.id] }),
}));

export const savingsGoalsRelations = relations(savingsGoals, ({ one, many }) => ({
  currency: one(currencies, { fields: [savingsGoals.currencyId], references: [currencies.id] }),
  contributions: many(goalContributions),
}));

export const goalContributionsRelations = relations(goalContributions, ({ one }) => ({
  goal: one(savingsGoals, { fields: [goalContributions.goalId], references: [savingsGoals.id] }),
  transaction: one(transactions, {
    fields: [goalContributions.transactionId],
    references: [transactions.id],
  }),
}));

export const contactsRelations = relations(contacts, ({ many }) => ({
  debts: many(debts),
}));

export const debtsRelations = relations(debts, ({ one, many }) => ({
  contact: one(contacts, { fields: [debts.contactId], references: [contacts.id] }),
  account: one(accounts, { fields: [debts.accountId], references: [accounts.id] }),
  currency: one(currencies, { fields: [debts.currencyId], references: [currencies.id] }),
  initialTransaction: one(transactions, {
    fields: [debts.initialTransactionId],
    references: [transactions.id],
  }),
  payments: many(debtPayments),
}));

export const debtPaymentsRelations = relations(debtPayments, ({ one }) => ({
  debt: one(debts, { fields: [debtPayments.debtId], references: [debts.id] }),
  transaction: one(transactions, {
    fields: [debtPayments.transactionId],
    references: [transactions.id],
  }),
}));

export const shoppingListsRelations = relations(shoppingLists, ({ one, many }) => ({
  currency: one(currencies, { fields: [shoppingLists.currencyId], references: [currencies.id] }),
  items: many(shoppingListItems),
  resultingTransaction: one(transactions, {
    fields: [shoppingLists.resultingTransactionId],
    references: [transactions.id],
  }),
}));

export const shoppingListItemsRelations = relations(shoppingListItems, ({ one }) => ({
  list: one(shoppingLists, { fields: [shoppingListItems.listId], references: [shoppingLists.id] }),
}));
