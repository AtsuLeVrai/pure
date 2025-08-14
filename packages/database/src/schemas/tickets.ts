import { index, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { v7 } from "uuid";
import { ticketPriorityEnum, ticketStatusEnum } from "./enums";

export const tickets = pgTable(
  "tickets",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => v7()),
    guildId: varchar("guild_id", { length: 20 }).notNull(),
    channelId: varchar("channel_id", { length: 20 }).notNull().unique(),
    userId: varchar("user_id", { length: 20 }).notNull(),
    assignedTo: varchar("assigned_to", { length: 20 }),
    category: text("category").notNull(),
    status: ticketStatusEnum("status").default("OPEN"),
    priority: ticketPriorityEnum("priority").default("LOW"),
    subject: text("subject").notNull(),
    closedReason: text("closed_reason"),
    closedBy: varchar("closed_by", { length: 20 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    closedAt: timestamp("closed_at"),
    deletedAt: timestamp("deleted_at"),
    deletedBy: varchar("deleted_by", { length: 20 }),
  },
  (table) => [
    index("tickets_guild_idx").on(table.guildId),
    index("tickets_user_idx").on(table.userId),
    index("tickets_status_idx").on(table.status),
  ],
);

export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;
