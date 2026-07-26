import { integer, type AnySQLiteColumn, index, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { idCol, syncCols } from "./_shared";

export const categoryTypeValues = ["expense", "income"] as const;

export const categories = sqliteTable(
  "categories",
  {
    id: idCol(),
    name: text("name").notNull(),
    type: text("type", { enum: categoryTypeValues }).notNull(),
    icon: text("icon"),
    color: text("color"),
    // null = root category; set = this is a subcategory of another category
    parentCategoryId: text("parent_category_id").references(
      (): AnySQLiteColumn => categories.id
    ),
    isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    ...syncCols(),
  },
  (t) => ({
    parentIdx: index("categories_parent_idx").on(t.parentCategoryId),
  })
);
