import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { idCol, syncCols } from "./_shared";
import { accounts } from "./accounts";
import { categories } from "./categories";
import { currencies } from "./currencies";

export const transactionTypeValues = ["income", "expense", "transfer"] as const;
export const entrySourceValues = ["manual", "voice", "receipt_photo"] as const;

export const transactions = sqliteTable(
  "transactions",
  {
    id: idCol(),
    accountId: text("account_id")
      .notNull()
      .references(() => accounts.id),
    categoryId: text("category_id").references(() => categories.id), // nullable: transfers have no category
    currencyId: text("currency_id")
      .notNull()
      .references(() => currencies.id), // denormalized from account at write-time
    type: text("type", { enum: transactionTypeValues }).notNull(),
    amountMinor: integer("amount_minor").notNull(), // always positive; sign implied by `type`
    occurredAt: integer("occurred_at").notNull(),
    description: text("description"),
    // transfer support: if type = 'transfer', this points at the destination account
    transferAccountId: text("transfer_account_id").references(() => accounts.id),
    // capture-method metadata, room for future voice/OCR without redesign
    entrySource: text("entry_source", { enum: entrySourceValues }).notNull().default("manual"),
    rawVoiceTranscript: text("raw_voice_transcript"),
    receiptImagePath: text("receipt_image_path"),
    ocrRawText: text("ocr_raw_text"),
    ...syncCols(),
  },
  (t) => ({
    accountIdx: index("transactions_account_idx").on(t.accountId),
    categoryIdx: index("transactions_category_idx").on(t.categoryId),
    occurredAtIdx: index("transactions_occurred_at_idx").on(t.occurredAt),
  })
);
