import { and, asc, eq, isNull } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { db } from "@/db/client";
import { accounts, transactions, type AccountType } from "@/db/schema";

export function useAccounts() {
  return useLiveQuery(
    db.query.accounts.findMany({
      where: and(isNull(accounts.deletedAt), eq(accounts.isArchived, false)),
      orderBy: [asc(accounts.sortOrder), asc(accounts.name)],
      with: { currency: true },
    })
  );
}

export function useAccount(id: string | undefined) {
  return useLiveQuery(
    id
      ? db.query.accounts.findFirst({
          where: eq(accounts.id, id),
          with: { currency: true },
        })
      : db.query.accounts.findFirst({ where: isNull(accounts.id) }),
    [id]
  );
}

export type CreateAccountInput = {
  name: string;
  label?: string;
  type: AccountType;
  currencyId: string;
  icon: string;
  color: string;
  openingBalanceMinor?: number;
};

export function createAccount(input: CreateAccountInput) {
  return db.transaction((tx) => {
    const [account] = tx
      .insert(accounts)
      .values({
        name: input.name,
        label: input.label || null,
        type: input.type,
        currencyId: input.currencyId,
        icon: input.icon,
        color: input.color,
      })
      .returning()
      .all();

    if (input.openingBalanceMinor && input.openingBalanceMinor > 0) {
      tx.insert(transactions)
        .values({
          accountId: account.id,
          categoryId: null,
          currencyId: input.currencyId,
          type: "income",
          amountMinor: input.openingBalanceMinor,
          occurredAt: Date.now(),
          description: "Saldo inicial",
          entrySource: "manual",
        })
        .run();

      tx.update(accounts)
        .set({ balanceMinor: input.openingBalanceMinor, updatedAt: Date.now() })
        .where(eq(accounts.id, account.id))
        .run();
    }

    return account;
  });
}

export type UpdateAccountInput = {
  name: string;
  label?: string;
  type: AccountType;
  icon: string;
  color: string;
};

export function updateAccount(id: string, input: UpdateAccountInput) {
  return db
    .update(accounts)
    .set({ ...input, label: input.label || null, updatedAt: Date.now() })
    .where(eq(accounts.id, id))
    .run();
}

export function archiveAccount(id: string) {
  return db
    .update(accounts)
    .set({ isArchived: true, updatedAt: Date.now() })
    .where(eq(accounts.id, id))
    .run();
}
