import {
  boolean,
  char,
  index,
  int,
  mediumtext,
  mysqlTable,
  primaryKey,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("user", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export const sessions = mysqlTable(
  "session",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: varchar("token", { length: 255 }).notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
    ipAddress: varchar("ip_address", { length: 255 }),
    userAgent: text("user_agent"),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const accounts = mysqlTable(
  "account",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    accountId: varchar("account_id", { length: 255 }).notNull(),
    providerId: varchar("provider_id", { length: 255 }).notNull(),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
);

export const verifications = mysqlTable(
  "verification",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    identifier: varchar("identifier", { length: 255 }).notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const auctions = mysqlTable("auctions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  category: varchar("category", { length: 255 }).notNull(),
  image: mediumtext("image").notNull(),
  price: int("price").notNull(),
  bidCount: int("bid_count").notNull().default(0),
  increment: int("increment").notNull(),
  endsAt: timestamp("ends_at").notNull(),
  tag: varchar("tag", { length: 255 }).notNull(),
  description: text("description").notNull(),
  seller: varchar("seller", { length: 255 }).notNull(),
  sellerId: varchar("seller_id", { length: 255 }).references(() => users.id, {
    onDelete: "set null",
  }),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const bids = mysqlTable(
  "bids",
  {
    id: char("id", { length: 36 }).primaryKey(),
    auctionId: varchar("auction_id", { length: 255 })
      .notNull()
      .references(() => auctions.id, { onDelete: "cascade" }),
    bidderId: varchar("bidder_id", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amount: int("amount").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("bids_auction_id_idx").on(table.auctionId),
    index("bids_bidder_id_idx").on(table.bidderId),
  ],
);

export const watchlist = mysqlTable(
  "watchlist",
  {
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    auctionId: varchar("auction_id", { length: 255 })
      .notNull()
      .references(() => auctions.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.auctionId] })],
);
