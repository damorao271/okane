import { integer, text } from "drizzle-orm/sqlite-core";

// Plain-JS UUID v4 generator (no native modules) so this schema file can be
// evaluated both by drizzle-kit (Node, at migration-generation time) and by the
// app at runtime (Hermes) without pulling in a react-native-dependent package.
function uuidv4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const idCol = () => text("id").primaryKey().$defaultFn(() => uuidv4());

export const syncCols = () => ({
  createdAt: integer("created_at").notNull().$defaultFn(() => Date.now()),
  updatedAt: integer("updated_at").notNull().$defaultFn(() => Date.now()),
  deletedAt: integer("deleted_at"),
});
