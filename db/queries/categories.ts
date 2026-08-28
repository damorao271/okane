import { and, asc, eq, isNull } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { db } from "@/db/client";
import { categories, type CategoryType } from "@/db/schema";

export function useCategoriesByType(type: CategoryType) {
  return useLiveQuery(
    db.query.categories.findMany({
      where: and(
        eq(categories.type, type),
        isNull(categories.parentCategoryId),
        isNull(categories.deletedAt)
      ),
      orderBy: [asc(categories.sortOrder), asc(categories.name)],
      with: {
        children: {
          where: isNull(categories.deletedAt),
          orderBy: [asc(categories.sortOrder), asc(categories.name)],
        },
      },
    }),
    [type]
  );
}

export function useCategory(id: string | undefined) {
  return useLiveQuery(
    id
      ? db.query.categories.findFirst({
          where: eq(categories.id, id),
          with: { parent: true, children: { where: isNull(categories.deletedAt) } },
        })
      : db.query.categories.findFirst({
          where: isNull(categories.id),
          with: { parent: true, children: { where: isNull(categories.deletedAt) } },
        }),
    [id]
  );
}

export type CreateCategoryInput = {
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  parentCategoryId?: string;
};

export function createCategory(input: CreateCategoryInput) {
  return db.transaction((tx) => {
    if (input.parentCategoryId) {
      const parent = tx
        .select()
        .from(categories)
        .where(eq(categories.id, input.parentCategoryId))
        .get();
      if (!parent) throw new Error("Parent category not found");

      return tx
        .insert(categories)
        .values({
          name: input.name,
          type: parent.type,
          icon: input.icon,
          color: parent.color,
          parentCategoryId: parent.id,
        })
        .returning()
        .get();
    }

    return tx
      .insert(categories)
      .values({
        name: input.name,
        type: input.type,
        icon: input.icon,
        color: input.color,
      })
      .returning()
      .get();
  });
}

export type UpdateCategoryInput = {
  name: string;
  icon: string;
  color?: string;
};

export function updateCategory(id: string, input: UpdateCategoryInput) {
  return db.transaction((tx) => {
    const current = tx.select().from(categories).where(eq(categories.id, id)).get();
    if (!current) throw new Error("Category not found");

    const color = current.parentCategoryId ? current.color : (input.color ?? current.color);

    return tx
      .update(categories)
      .set({ name: input.name, icon: input.icon, color, updatedAt: Date.now() })
      .where(eq(categories.id, id))
      .run();
  });
}

export function deleteCategory(id: string) {
  return db.transaction((tx) => {
    const now = Date.now();
    tx.update(categories)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(categories.id, id))
      .run();
    tx.update(categories)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(categories.parentCategoryId, id))
      .run();
  });
}
