import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import {
  createAuction as createAuctionOnServer,
  loadAuctionState,
  submitBid,
  toggleWatchlistItem,
} from "@/lib/auction-api";
import { initialAuctions, categories, type Auction } from "./initial-data";

export { initialAuctions, categories };
export type { Auction };

export type Bid = { id: string; auctionId: string; amount: number; date: string };
export type AuctionUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
};
export type NewAuction = {
  title: string;
  category: string;
  description: string;
  price: number;
  increment: number;
  durationHours: number;
  image: string;
};

type Store = {
  auctions: Auction[];
  watched: string[];
  bids: Bid[];
  user: AuctionUser | null;
  loading: boolean;
  error: string | null;
  reportError: (message: string) => void;
  toggleWatch: (id: string) => Promise<void>;
  placeBid: (id: string, amount: number) => Promise<string | null>;
  addAuction: (item: NewAuction) => Promise<Auction>;
  closeAuction: (id: string) => void;
};

const AuctionContext = createContext<Store | null>(null);

export function AuctionProvider({ children }: { children: ReactNode }) {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [watched, setWatched] = useState<string[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [user, setUser] = useState<AuctionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    loadAuctionState()
      .then((state) => {
        if (!mounted) return;
        setAuctions(state.auctions);
        setWatched(state.watched);
        setBids(state.bids);
        setUser(state.user);
      })
      .catch((cause: unknown) => {
        console.error("Unable to load auction data.", cause);
        if (mounted)
          setError(
            "Auction data could not be loaded. Check the backend configuration and refresh.",
          );
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setAuctions((items) =>
        items.map((item) =>
          item.closed
            ? item
            : { ...item, seconds: Math.max(0, item.seconds - 1), closed: item.seconds <= 1 },
        ),
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleWatch = async (id: string) => {
    setError(null);
    try {
      const result = await toggleWatchlistItem({ data: { auctionId: id } });
      setWatched((current) =>
        result.saved
          ? current.includes(id)
            ? current
            : [...current, id]
          : current.filter((itemId) => itemId !== id),
      );
    } catch (cause) {
      console.error("Unable to update the watchlist.", cause);
      setError("Unable to update your watchlist. Please sign in again and retry.");
    }
  };

  const placeBid = async (id: string, amount: number) => {
    const item = auctions.find((auction) => auction.id === id);
    if (!item || item.closed || item.seconds <= 0) return "This auction is closed.";
    if (!Number.isFinite(amount) || amount < item.price + item.increment) {
      return `Enter a bid of at least ${money(item.price + item.increment)}.`;
    }

    try {
      const result = await submitBid({ data: { auctionId: id, amount } });
      if (result.error) return result.error;
      setAuctions((current) =>
        current.map((auction) => (auction.id === result.auction.id ? result.auction : auction)),
      );
      setBids((current) => [result.bid, ...current]);
      return null;
    } catch (cause) {
      console.error("Unable to submit the bid.", cause);
      return "Your bid could not be saved. Please sign in again and retry.";
    }
  };

  const addAuction = async (item: NewAuction) => {
    try {
      const created = await createAuctionOnServer({ data: item });
      setAuctions((current) => [created, ...current]);
      return created;
    } catch (cause) {
      const message =
        cause instanceof Error && cause.message
          ? cause.message
          : "The auction could not be created. Please sign in again and retry.";
      throw new Error(message);
    }
  };

  const closeAuction = (id: string) => {
    setAuctions((current) =>
      current.map((item) => (item.id === id ? { ...item, closed: true } : item)),
    );
  };

  return (
    <AuctionContext.Provider
      value={{
        auctions,
        watched,
        bids,
        user,
        loading,
        error,
        reportError: setError,
        toggleWatch,
        placeBid,
        addAuction,
        closeAuction,
      }}
    >
      {children}
    </AuctionContext.Provider>
  );
}

export function useAuctions() {
  const value = useContext(AuctionContext);
  if (!value) throw new Error("Auction provider required");
  return value;
}

export const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

export function timeLeft(seconds: number) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return days
    ? `${days}d ${hours}h ${minutes}m`
    : `${hours}h ${minutes}m ${String(remainingSeconds).padStart(2, "0")}s`;
}
