import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { v7 } from "uuid";

export const customCommands = pgTable(
  "custom_commands",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => v7()),
    guildId: varchar("guild_id", { length: 20 }).notNull(),
    name: text("name").notNull(),
    description: text("description"),
    response: text("response").notNull(),
    uses: integer("uses").default(0),
    enabled: boolean("enabled").default(true),
    createdBy: varchar("created_by", { length: 20 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
    deletedBy: varchar("deleted_by", { length: 20 }),
  },
  (table) => [
    unique().on(table.guildId, table.name),
    index("custom_commands_guild_idx").on(table.guildId),
  ],
);

export type CustomCommand = typeof customCommands.$inferSelect;
export type NewCustomCommand = typeof customCommands.$inferInsert;
