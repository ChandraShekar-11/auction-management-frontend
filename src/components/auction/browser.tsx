import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Armchair,
  ArrowRight,
  BadgeCheck,
  Car,
  Clock3,
  Gavel,
  Heart,
  Headphones,
  LayoutGrid,
  Palette,
  Search,
  Shirt,
  ShieldCheck,
  SlidersHorizontal,
  Truck,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { categories, money, timeLeft, useAuctions, type Auction } from "./store";
import camera from "@/assets/camera-hero.jpg";

const icons = [LayoutGrid, Headphones, Shirt, Armchair, Palette, Car];

export function AuctionCard({ item }: { item: Auction }) {
  const { watched, toggleWatch, user } = useAuctions();
  const saved = watched.includes(item.id);

  return (
    <article className="auction-card">
      <div className={`image-wrap ${item.id === "vintage-camera" ? "camera" : ""}`}>
        <Link to="/auction/$auctionId" params={{ auctionId: item.id }}>
          <img
            src={item.image}
            alt={item.title}
            className="product-image"
            width={816}
            height={816}
            loading="lazy"
          />
        </Link>
        <span className={`item-tag ${item.tag === "Ending soon" ? "ending" : ""}`}>
          {item.closed ? "Closed" : item.tag}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className={`watch-button ${saved ? "saved" : ""}`}
          aria-label={`${saved ? "Remove" : "Save"} ${item.title}`}
          title={
            user ? (saved ? "Remove from watchlist" : "Save to watchlist") : "Sign in to save items"
          }
          disabled={!user}
          onClick={() => void toggleWatch(item.id)}
        >
          <Heart size={15} />
        </Button>
      </div>
      <div className="card-body">
        <div className="item-category">{item.category}</div>
        <Link to="/auction/$auctionId" params={{ auctionId: item.id }}>
          <h3>{item.title}</h3>
        </Link>
        <div className="item-price">
          <div>
            <div className="small-label">Current bid</div>
            <div className="price">{money(item.price)}</div>
          </div>
          <span className="bid-count">{item.bids} bids</span>
        </div>
        <div className="card-bottom">
          <span className={`countdown ${item.seconds < 3600 ? "urgent" : ""}`}>
            <Clock3 />
            {item.closed ? "Auction closed" : timeLeft(item.seconds)}
          </span>
          <Button asChild variant="outline" className="bid-link">
            <Link to="/auction/$auctionId" params={{ auctionId: item.id }}>
              {item.closed ? "View item" : "Place bid"}
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

export function AuctionBrowser() {
  const { auctions, loading } = useAuctions();
  const [category, setCategory] = useState("All auctions");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("ending");
  const [filters, setFilters] = useState(false);
  const [maxPrice, setMaxPrice] = useState("");
  const [activeOnly, setActiveOnly] = useState(true);

  const items = useMemo(
    () =>
      auctions
        .filter(
          (item) =>
            (category === "All auctions" || item.category === category) &&
            item.title.toLowerCase().includes(query.toLowerCase()) &&
            (!maxPrice || item.price <= Number(maxPrice)) &&
            (!activeOnly || !item.closed),
        )
        .sort((a, b) =>
          sort === "low"
            ? a.price - b.price
            : sort === "high"
              ? b.price - a.price
              : sort === "popular"
                ? b.bids - a.bids
                : a.seconds - b.seconds,
        ),
    [auctions, category, query, maxPrice, sort, activeOnly],
  );

  const browse = () =>
    document.getElementById("live-auctions")?.scrollIntoView({ behavior: "smooth" });

  return (
    <main className="page-container">
      <section className="hero">
        <img
          src={camera}
          alt="Vintage silver rangefinder camera on a sage studio background"
          className="hero-image"
          width={1536}
          height={768}
        />
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="live-dot" />
            The thrill of the find
          </div>
          <h1>
            Extraordinary items.
            <br />
            Live auctions.
          </h1>
          <p>
            Discover pieces with a story. Place your bid.
            <br />
            Make something remarkable yours.
          </p>
          <Button onClick={browse}>
            Explore auctions
            <ArrowRight />
          </Button>
        </div>
        <div className="hero-caption">
          <strong>Leica M3 · A timeless original</strong>
          <span>From the Analog Archive collection</span>
        </div>
      </section>
      <div className="trust-strip">
        <span>
          <ShieldCheck />
          Bid with confidence
        </span>
        <span>
          <BadgeCheck />
          Unique finds, trusted sellers
        </span>
        <span>
          <Truck />
          From their collection to yours
        </span>
      </div>
      <section id="live-auctions">
        <div className="section-heading">
          <div>
            <h2>Find your next great thing</h2>
            <p>A little curiosity can lead to something extraordinary.</p>
          </div>
          <span className="live-indicator">
            <span className="live-dot" />
            {auctions.filter((item) => !item.closed).length} live auctions
          </span>
        </div>
        <div className="category-tabs">
          {categories.map((itemCategory, index) => {
            const Icon = icons[index] ?? LayoutGrid;
            return (
              <Button
                key={itemCategory}
                variant={category === itemCategory ? "default" : "outline"}
                className="category"
                onClick={() => setCategory(itemCategory)}
              >
                <Icon />
                {itemCategory}
              </Button>
            );
          })}
        </div>
        <div className="filter-row">
          <label className="search-box">
            <Search />
            <input
              aria-label="Search auctions"
              placeholder="Search for your next find..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Clear search"
                onClick={() => setQuery("")}
              >
                <X />
              </Button>
            )}
          </label>
          <Button variant="outline" className="h-[42px] text-xs" onClick={() => setFilters(true)}>
            <SlidersHorizontal />
            Filters{maxPrice ? " (1)" : ""}
          </Button>
          <span className="result-count">Showing {items.length} auctions</span>
          <select
            aria-label="Sort auctions"
            className="field sort"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="ending">Ending soonest</option>
            <option value="popular">Most bids</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
          </select>
        </div>
        {loading ? (
          <p role="status" className="py-12 text-center">
            Loading auctions...
          </p>
        ) : items.length ? (
          <div className="auction-grid">
            {items.map((item) => (
              <AuctionCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Search />
            <h3>No auctions found</h3>
            <p>Try another category or adjust your search.</p>
            <Button
              variant="outline"
              onClick={() => {
                setCategory("All auctions");
                setQuery("");
                setMaxPrice("");
              }}
            >
              Reset filters
            </Button>
          </div>
        )}
      </section>
      <section className="lower-band">
        <div>
          <h3>Something special to sell?</h3>
          <p>Find the right audience for the things you love.</p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/sell">
            Start selling
            <ArrowRight />
          </Link>
        </Button>
      </section>
      <Dialog open={filters} onOpenChange={setFilters}>
        <DialogContent>
          <DialogTitle>Filter auctions</DialogTitle>
          <DialogDescription>Narrow your search to find the right piece.</DialogDescription>
          <label className="grid gap-2 text-sm">
            Maximum current bid ($)
            <input
              className="field"
              type="number"
              min="0"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              placeholder="No maximum"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(event) => setActiveOnly(event.target.checked)}
            />
            Active auctions only
          </label>
          <Button onClick={() => setFilters(false)}>Show auctions</Button>
        </DialogContent>
      </Dialog>
    </main>
  );
}

export function Watchlist() {
  const { auctions, watched, user, loading } = useAuctions();
  const items = auctions.filter((item) => watched.includes(item.id));

  if (!user) {
    return (
      <main className="page-container">
        <h1 className="workspace-title">Your watchlist</h1>
        <div className="empty-state">
          <Heart />
          <h3>Sign in to keep your favorite finds close</h3>
          <p>Your saved items will be stored with your Google account.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page-container">
      <h1 className="workspace-title">Your watchlist</h1>
      <p className="workspace-subtitle">
        The pieces you have your eye on. {items.length} saved{" "}
        {items.length === 1 ? "item" : "items"}.
      </p>
      {loading ? (
        <p role="status">Loading watchlist...</p>
      ) : items.length ? (
        <div className="auction-grid">
          {items.map((item) => (
            <AuctionCard item={item} key={item.id} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Heart />
          <h3>Your next discovery is waiting</h3>
          <p>Save an auction to keep it close.</p>
          <Button asChild>
            <Link to="/">
              Browse auctions
              <ArrowRight />
            </Link>
          </Button>
        </div>
      )}
    </main>
  );
}

export function MyBids() {
  const { auctions, bids, user, loading } = useAuctions();
  if (!user) {
    return (
      <main className="page-container">
        <h1 className="workspace-title">My bids</h1>
        <div className="empty-state">
          <Gavel />
          <h3>Sign in to see your bids</h3>
          <p>Your bid history is stored with your Google account.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page-container">
      <h1 className="workspace-title">My bids</h1>
      <p className="workspace-subtitle">
        Every bid, every possibility. Keep track of your auction activity.
      </p>
      {loading ? (
        <p role="status">Loading your bids...</p>
      ) : bids.length ? (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Your bid</th>
                <th>Current bid</th>
                <th>Status</th>
                <th>Placed</th>
              </tr>
            </thead>
            <tbody>
              {bids.map((bid) => {
                const item = auctions.find((auction) => auction.id === bid.auctionId);
                if (!item) return null;
                return (
                  <tr key={bid.id}>
                    <td>
                      <Link to="/auction/$auctionId" params={{ auctionId: item.id }}>
                        {item.title}
                      </Link>
                    </td>
                    <td>{money(bid.amount)}</td>
                    <td>{money(item.price)}</td>
                    <td>
                      <span className="status-pill">
                        {item.closed
                          ? bid.amount === item.price
                            ? "Won"
                            : "Closed"
                          : bid.amount === item.price
                            ? "Highest bidder"
                            : "Outbid"}
                      </span>
                    </td>
                    <td>{bid.date}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <Gavel />
          <h3>Let the bidding begin</h3>
          <p>You haven&apos;t placed any bids yet.</p>
          <Button asChild>
            <Link to="/">
              Discover auctions
              <ArrowRight />
            </Link>
          </Button>
        </div>
      )}
    </main>
  );
}
