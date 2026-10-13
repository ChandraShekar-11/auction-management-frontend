import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import type { InferSelectModel } from "drizzle-orm";
import { z } from "zod";

import type { Auction } from "@/components/auction/initial-data";

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  image: z.string().nullable(),
});

async function currentUser() {
  const { auth } = await import("@/lib/auth.server");
  const session = await auth.api.getSession({ headers: getRequestHeaders() });
  return session?.user ?? null;
}

async function requireUser() {
  const user = await currentUser();
  if (!user) {
    throw new Error("Sign in to bid, save items, or create an auction.");
  }
  return user;
}

type AuctionRow = InferSelectModel<typeof import("@/db/schema").auctions>;

function toAuction(row: AuctionRow): Auction {
  const seconds = Math.max(0, Math.floor((row.endsAt.getTime() - Date.now()) / 1000));
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    image: row.image,
    price: row.price,
    bids: row.bidCount,
    seconds,
    increment: row.increment,
    tag: row.tag,
    description: row.description,
    seller: row.seller,
    closed: Boolean(row.closedAt) || seconds === 0,
  };
}

export const loadAuctionState = createServerFn({ method: "GET" }).handler(async () => {
  const [{ db }, { auctions, bids, watchlist }, { asc, desc, eq }] = await Promise.all([
    import("@/db/connection.server"),
    import("@/db/schema"),
    import("drizzle-orm"),
  ]);
  const { initialAuctions } = await import("@/components/auction/initial-data");

  const [existingAuction] = await db.select({ id: auctions.id }).from(auctions).limit(1);
  if (!existingAuction) {
    await db.insert(auctions).values(
      initialAuctions.map((item) => ({
        id: item.id,
        title: item.title,
        category: item.category,
        image: item.image,
        price: item.price,
        bidCount: item.bids,
        increment: item.increment,
        endsAt: new Date(Date.now() + item.seconds * 1000),
        tag: item.tag,
        description: item.description,
        seller: item.seller,
      })),
    );
  }

  const [auctionRows, user] = await Promise.all([
    db.select().from(auctions).orderBy(asc(auctions.endsAt)),
    currentUser(),
  ]);

  if (!user) {
    return { auctions: auctionRows.map(toAuction), watched: [], bids: [], user: null };
  }

  const [watchRows, bidRows] = await Promise.all([
    db
      .select({ auctionId: watchlist.auctionId })
      .from(watchlist)
      .where(eq(watchlist.userId, user.id)),
    db
      .select()
      .from(bids)
      .where(eq(bids.bidderId, user.id))
      .orderBy(desc(bids.createdAt))
      .limit(100),
  ]);

  return {
    auctions: auctionRows.map(toAuction),
    watched: watchRows.map((row) => row.auctionId),
    bids: bidRows.map((bid) => ({
      id: bid.id,
      auctionId: bid.auctionId,
      amount: bid.amount,
      date: bid.createdAt.toLocaleString(),
    })),
    user: userSchema.parse({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image ?? null,
    }),
  };
});

export const toggleWatchlistItem = createServerFn({ method: "POST" })
  .validator(z.object({ auctionId: z.string().min(1) }))
  .handler(async ({ data }) => {
    const [{ db }, { auctions, watchlist }, { and, eq }] = await Promise.all([
      import("@/db/connection.server"),
      import("@/db/schema"),
      import("drizzle-orm"),
    ]);
    const user = await requireUser();
    const [auction] = await db
      .select({ id: auctions.id })
      .from(auctions)
      .where(eq(auctions.id, data.auctionId))
      .limit(1);

    if (!auction) throw new Error("That auction no longer exists.");

    const [existing] = await db
      .select({ auctionId: watchlist.auctionId })
      .from(watchlist)
      .where(and(eq(watchlist.userId, user.id), eq(watchlist.auctionId, data.auctionId)))
      .limit(1);

    if (existing) {
      await db
        .delete(watchlist)
        .where(and(eq(watchlist.userId, user.id), eq(watchlist.auctionId, data.auctionId)));
      return { saved: false };
    }

    await db.insert(watchlist).values({ userId: user.id, auctionId: data.auctionId });
    return { saved: true };
  });

const bidSchema = z.object({
  auctionId: z.string().min(1),
  amount: z.number().int().positive(),
});

export const submitBid = createServerFn({ method: "POST" })
  .validator(bidSchema)
  .handler(async ({ data }) => {
    const [{ db }, { auctions, bids }, { eq, sql }] = await Promise.all([
      import("@/db/connection.server"),
      import("@/db/schema"),
      import("drizzle-orm"),
    ]);
    const user = await requireUser();

    return db.transaction(async (transaction) => {
      const [auction] = await transaction
        .select()
        .from(auctions)
        .where(eq(auctions.id, data.auctionId))
        .for("update")
        .limit(1);

      if (!auction) return { error: "This auction could not be found." };
      if (auction.closedAt || auction.endsAt.getTime() <= Date.now()) {
        return { error: "This auction is closed." };
      }
      if (data.amount < auction.price + auction.increment) {
        return {
          error: `Enter a bid of at least ${auction.price + auction.increment}.`,
        };
      }

      const bidId = crypto.randomUUID();
      const bidCreatedAt = new Date();

      await transaction.insert(bids).values({
        id: bidId,
        auctionId: auction.id,
        bidderId: user.id,
        amount: data.amount,
        createdAt: bidCreatedAt,
      });

      await transaction
        .update(auctions)
        .set({
          price: data.amount,
          bidCount: sql`${auctions.bidCount} + 1`,
        })
        .where(eq(auctions.id, auction.id));

      const [updatedAuction] = await transaction
        .select()
        .from(auctions)
        .where(eq(auctions.id, auction.id))
        .limit(1);

      if (!updatedAuction) {
        throw new Error("The bid could not be saved.");
      }

      return {
        error: null,
        auction: toAuction(updatedAuction),
        bid: {
          id: bidId,
          auctionId: auction.id,
          amount: data.amount,
          date: bidCreatedAt.toLocaleString(),
        },
      };
    });
  });

const createAuctionSchema = z.object({
  title: z.string().trim().min(3).max(90),
  category: z.enum([
    "Electronics",
    "Fashion",
    "Home & Furniture",
    "Art & Collectibles",
    "Automotive",
  ]),
  description: z.string().trim().min(10).max(2000),
  price: z.number().int().positive(),
  increment: z.number().int().positive(),
  durationHours: z.number().int().positive().max(168),
  image: z
    .string()
    .max(7_000_000)
    .refine(
      (value) =>
        /^data:image\/(png|jpeg|webp);base64,/.test(value) ||
        /^https?:\/\//.test(value) ||
        /^\/assets\/[\w.-]+$/.test(value),
      "Use a PNG, JPEG, or WebP image.",
    ),
});

export const createAuction = createServerFn({ method: "POST" })
  .validator(createAuctionSchema)
  .handler(async ({ data }) => {
    const [{ db }, { auctions }, { eq }] = await Promise.all([
      import("@/db/connection.server"),
      import("@/db/schema"),
      import("drizzle-orm"),
    ]);
    const user = await requireUser();
    const id = crypto.randomUUID();
    const endsAt = new Date(Date.now() + data.durationHours * 60 * 60 * 1000);

    try {
      await db.insert(auctions).values({
        id,
        title: data.title,
        category: data.category,
        image: data.image,
        price: data.price,
        increment: data.increment,
        endsAt,
        tag: "New listing",
        description: data.description,
        seller: user.name,
        sellerId: user.id,
      });
    } catch (cause) {
      const detail = cause instanceof Error ? cause.message : String(cause);
      if (/Data too long|ER_DATA_TOO_LONG|1406/i.test(detail)) {
        throw new Error(
          "That image is too large to store. Choose a smaller photo or use the default image.",
        );
      }
      throw new Error(`Could not save the auction. ${detail}`);
    }

    const [created] = await db.select().from(auctions).where(eq(auctions.id, id)).limit(1);

    if (!created) throw new Error("The auction could not be created.");
    return toAuction(created);
  });
