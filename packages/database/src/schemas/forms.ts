import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { v7 } from "uuid";

export const forms = pgTable(
  "forms",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => v7()),
    guildId: varchar("guild_id", { length: 20 }).notNull(),
    name: text("name").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    fieldsData: jsonb("fields_data").notNull(),
    enabled: boolean("enabled").default(true),
    createdBy: varchar("created_by", { length: 20 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
    deletedBy: varchar("deleted_by", { length: 20 }),
  },
  (table) => [index("forms_guild_idx").on(table.guildId)],
);

export type Form = typeof forms.$inferSelect;
export type NewForm = typeof forms.$inferInsert;

export const formSubmissions = pgTable(
  "form_submissions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => v7()),
    formId: text("form_id").notNull(),
    userId: varchar("user_id", { length: 20 }).notNull(),
    responses: jsonb("responses").notNull(),
    submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  },
  (table) => [
    index("form_submissions_form_idx").on(table.formId),
    index("form_submissions_user_idx").on(table.userId),
  ],
);

export type FormSubmission = typeof formSubmissions.$inferSelect;
export type NewFormSubmission = typeof formSubmissions.$inferInsert;
