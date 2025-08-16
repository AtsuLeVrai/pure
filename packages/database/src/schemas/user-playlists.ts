import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { v7 } from "uuid";

/**
 * User playlists for saving favorite music collections
 * Lightweight persistence layer for discord-player integration
 */
export const userPlaylists = pgTable(
  "user_playlists",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => v7()),

    userId: varchar("user_id", { length: 20 }).notNull(),
    guildId: varchar("guild_id", { length: 20 }).notNull(),

    // Playlist metadata
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),

    // Track storage (JSON array of track URLs/IDs)
    tracks: text("tracks").notNull(), // JSON string: ["url1", "url2", ...]
    trackCount: integer("track_count").default(0),
    totalDuration: integer("total_duration").default(0), // seconds

    // Settings
    allowCollaboration: boolean("allow_collaboration").default(false),

    // Usage stats
    playCount: integer("play_count").default(0),
    lastPlayed: timestamp("last_played"),

    // Metadata
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("user_playlists_user_idx").on(table.userId),
    index("user_playlists_guild_idx").on(table.guildId),
    index("user_playlists_user_guild_idx").on(table.userId, table.guildId),
    index("user_playlists_name_idx").on(table.name),
  ],
);

export type UserPlaylist = typeof userPlaylists.$inferSelect;
export type NewUserPlaylist = typeof userPlaylists.$inferInsert;
