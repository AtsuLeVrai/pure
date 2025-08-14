import {
  bigint,
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
import { economyTransactionTypeEnum } from "./enums";

export const userEconomy = pgTable(
  "user_economy",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => v7()),
    userId: varchar("user_id", { length: 20 }).notNull(),
    guildId: varchar("guild_id", { length: 20 }).notNull(),
    balance: bigint("balance", { mode: "number" }).default(0),
    bank: bigint("bank", { mode: "number" }).default(0),
    lastDaily: timestamp("last_daily"),
    lastWeekly: timestamp("last_weekly"),
    lastWork: timestamp("last_work"),
    dailyStreak: integer("daily_streak").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    unique().on(table.userId, table.guildId),
    index("user_economy_guild_idx").on(table.guildId),
  ],
);

export type UserEconomy = typeof userEconomy.$inferSelect;
export type NewUserEconomy = typeof userEconomy.$inferInsert;

export const economyTransactions = pgTable(
  "economy_transactions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => v7()),
    userId: varchar("user_id", { length: 20 }).notNull(),
    guildId: varchar("guild_id", { length: 20 }).notNull(),
    type: economyTransactionTypeEnum("type").notNull(),
    amount: bigint("amount", { mode: "number" }).notNull(),
    description: text("description").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("economy_transactions_user_guild_idx").on(
      table.userId,
      table.guildId,
    ),
    index("economy_transactions_guild_idx").on(table.guildId),
    index("economy_transactions_type_idx").on(table.type),
    index("economy_transactions_created_at_idx").on(table.createdAt),
  ],
);

export type EconomyTransaction = typeof economyTransactions.$inferSelect;
export type NewEconomyTransaction = typeof economyTransactions.$inferInsert;

export const shopItems = pgTable(
  "shop_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => v7()),
    guildId: varchar("guild_id", { length: 20 }).notNull(),
    name: text("name").notNull(),
    description: text("description"),
    price: bigint("price", { mode: "number" }).notNull(),
    roleId: varchar("role_id", { length: 20 }),
    stock: integer("stock"),
    enabled: boolean("enabled").default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
    deletedBy: varchar("deleted_by", { length: 20 }),
  },
  (table) => [
    index("shop_items_guild_idx").on(table.guildId),
    index("shop_items_enabled_idx").on(table.enabled),
  ],
);

export type ShopItem = typeof shopItems.$inferSelect;
export type NewShopItem = typeof shopItems.$inferInsert;

export const shopPurchases = pgTable(
  "shop_purchases",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => v7()),
    userId: varchar("user_id", { length: 20 }).notNull(),
    guildId: varchar("guild_id", { length: 20 }).notNull(),
    itemId: text("item_id").notNull(),
    pricePaid: bigint("price_paid", { mode: "number" }).notNull(),
    quantity: integer("quantity").default(1),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("shop_purchases_user_guild_idx").on(table.userId, table.guildId),
    index("shop_purchases_item_idx").on(table.itemId),
    index("shop_purchases_created_at_idx").on(table.createdAt),
  ],
);

export type ShopPurchase = typeof shopPurchases.$inferSelect;
export type NewShopPurchase = typeof shopPurchases.$inferInsert;
