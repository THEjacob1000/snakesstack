import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const postsTable = pgTable(
  "Posts",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("name_idx").on(table.name)]
)
