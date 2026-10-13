import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Heart, Plus, ShieldCheck, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { compressImageFile } from "@/lib/compress-image";
import { categories, money, timeLeft, useAuctions } from "./store";
import camera from "@/assets/camera-hero.jpg";

export function AuctionDetail({ id }: { id: string }) {
  const { auctions, placeBid, watched, toggleWatch, bids, user } = useAuctions();
  const item = auctions.find((auction) => auction.id === id);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!item) {
    return (
      <main className="page-container">
        <h1 className="workspace-title">Auction not found</h1>
        <Button asChild>
          <Link to="/">Back to auctions</Link>
        </Button>
      </main>
    );
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    const problem = await placeBid(item.id, Number(amount));
    setError(Boolean(problem));
    setMessage(problem ?? `Your bid of ${money(Number(amount))} was placed.`);
    if (!problem) setAmount("");
    setSubmitting(false);
  };

  const itemBids = bids.filter((bid) => bid.auctionId === id).slice(0, 5);

  return (
    <main className="page-container">
      <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground text-xs">
        <ArrowLeft size={15} />
        Back to auctions
      </Link>
      <div className="detail-grid">
        <img className="detail-photo" src={item.image} alt={item.title} width={816} height={816} />
        <div className="detail-copy">
          <span className="status-pill">{item.category}</span>
          <h1>{item.title}</h1>
          <p>{item.description}</p>
          <div className="mt-5 flex gap-2 items-center text-xs">
            <ShieldCheck size={16} />
            Sold by {item.seller}
          </div>
          <div className="detail-bid">
            <div className="small-label">Current highest bid · {item.bids} bids</div>
            <div className="price">{money(item.price)}</div>
            <div className="mt-3 text-muted-foreground text-sm">
              {item.closed ? "Auction closed" : `Ends in ${timeLeft(item.seconds)}`}
            </div>
            <form onSubmit={submit} className="bid-form">
              <input
                type="number"
                className="field"
                aria-label="Your bid amount"
                placeholder={`${money(item.price + item.increment)} or more`}
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
                min={item.price + item.increment}
                step={1}
                disabled={item.closed || !user || submitting}
              />
              <Button type="submit" disabled={item.closed || !user || submitting}>
                {item.closed ? "Closed" : submitting ? "Submitting..." : "Place bid"}
              </Button>
            </form>
            <div className="small-label">
              Minimum increment: {money(item.increment)} · Demo bids persist to this app&apos;s
              database
            </div>
            {!user && (
              <p className="text-sm text-muted-foreground">Sign in with Google to place a bid.</p>
            )}
            {message && (
              <p role="status" className={`feedback ${error ? "error" : ""}`}>
                {message}
              </p>
            )}
            <Button
              variant="outline"
              className="mt-5"
              disabled={!user}
              title={user ? undefined : "Sign in with Google to save items"}
              onClick={() => void toggleWatch(item.id)}
            >
              <Heart />
              {watched.includes(item.id) ? "Saved to watchlist" : "Add to watchlist"}
            </Button>
          </div>
          <h3 className="mt-5 mb-3">Your recent bidding activity</h3>
          {itemBids.length ? (
            itemBids.map((bid) => (
              <div key={bid.id} className="flex justify-between py-3 border-b text-sm">
                <span>{user?.name ?? "Your account"}</span>
                <strong>{money(bid.amount)}</strong>
              </div>
            ))
          ) : (
            <p className="text-sm">No bids from your account yet.</p>
          )}
        </div>
      </div>
    </main>
  );
}

export function SellerWorkspace() {
  const { addAuction, user, loading } = useAuctions();
  const navigate = useNavigate();
  const [image, setImage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const price = Number(form.get("price"));
    const increment = Number(form.get("increment"));
    if (price < 1 || increment < 1) {
      setError("Starting price and bid increment must be greater than zero.");
      return;
    }

    setError("");
    setSubmitted(true);
    try {
      const created = await addAuction({
        title: String(form.get("title")),
        category: String(form.get("category")),
        description: String(form.get("description")),
        price,
        increment,
        durationHours: Number(form.get("duration")),
        image: image || camera,
      });
      await navigate({ to: "/auction/$auctionId", params: { auctionId: created.id } });
    } catch (cause) {
      console.error("Unable to create the auction.", cause);
      const message =
        cause instanceof Error
          ? cause.message
          : "The auction could not be created. Please sign in again and retry.";
      setError(message);
      setSubmitted(false);
    }
  };

  return (
    <main className="page-container">
      <div className="form-layout">
        <h1 className="workspace-title">Give your item a new chapter</h1>
        <p className="workspace-subtitle">
          Create an auction and put your special find in the spotlight.
        </p>
        <form onSubmit={submit} className="form-grid">
          <label className="full">
            Item name
            <input
              className="field"
              name="title"
              placeholder="What are you selling?"
              maxLength={90}
              required
            />
          </label>
          <label>
            Category
            <select className="field" name="category">
              {categories.slice(1).map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>
          <label>
            Auction duration
            <select name="duration" className="field">
              <option value="24">24 hours</option>
              <option value="72">3 days</option>
              <option value="168">7 days</option>
            </select>
          </label>
          <label className="full">
            Description
            <textarea
              className="field"
              name="description"
              rows={4}
              placeholder="Tell buyers about the condition, details, and what makes it special."
              required
            />
          </label>
          <label>
            Starting price ($)
            <input
              className="field"
              type="number"
              name="price"
              min="1"
              step="1"
              placeholder="100"
              required
            />
          </label>
          <label>
            Minimum bid increment ($)
            <input
              className="field"
              type="number"
              name="increment"
              min="1"
              step="1"
              defaultValue="10"
              required
            />
          </label>
          <label className="full upload-area">
            <span className="flex gap-2 items-center">
              <Upload size={18} />
              Item photograph
            </span>
            <input
              aria-label="Item photograph"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                if (file.size > 12 * 1024 * 1024) {
                  setError("Please choose an image under 12 MB.");
                  return;
                }
                setError("");
                void compressImageFile(file)
                  .then((dataUrl) => setImage(dataUrl))
                  .catch((cause) => {
                    setError(
                      cause instanceof Error ? cause.message : "Could not process that image.",
                    );
                  });
              }}
            />
            {image && <img src={image} alt="Your item preview" className="upload-preview" />}
          </label>
          {error && (
            <p className="feedback error full" role="alert">
              {error}
            </p>
          )}
          <div className="full flex items-center justify-between gap-5">
            <span className="text-xs text-muted-foreground">
              {user
                ? "Listing saved to the app database"
                : "Sign in with Google to create a listing"}
            </span>
            <Button type="submit" disabled={!user || loading || submitted}>
              <Plus />
              {submitted ? "Creating..." : "Create auction"}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}

export function AdminWorkspace() {
  const { auctions, bids, closeAuction } = useAuctions();
  const [tab, setTab] = useState("auctions");

  return (
    <main className="page-container">
      <h1 className="workspace-title">Auction management</h1>
      <p className="workspace-subtitle">
        Demo-only administrator workspace. Changes here are not persisted or authorized as real
        admin actions.
      </p>
      <div className="admin-metrics">
        <div className="metric">
          <span className="text-muted-foreground text-xs">Active auctions</span>
          <strong>{auctions.filter((auction) => !auction.closed).length}</strong>
        </div>
        <div className="metric">
          <span className="text-muted-foreground text-xs">Total bids</span>
          <strong>{auctions.reduce((sum, auction) => sum + auction.bids, 0)}</strong>
        </div>
        <div className="metric">
          <span className="text-muted-foreground text-xs">Current auction value</span>
          <strong>{money(auctions.reduce((sum, auction) => sum + auction.price, 0))}</strong>
        </div>
      </div>
      <div className="admin-tabs">
        <Button
          variant={tab === "auctions" ? "default" : "outline"}
          onClick={() => setTab("auctions")}
        >
          Auctions
        </Button>
        <Button variant={tab === "bids" ? "default" : "outline"} onClick={() => setTab("bids")}>
          Bids
        </Button>
        <Button variant={tab === "users" ? "default" : "outline"} onClick={() => setTab("users")}>
          Users
        </Button>
        <Button
          variant={tab === "categories" ? "default" : "outline"}
          onClick={() => setTab("categories")}
        >
          Categories
        </Button>
      </div>
      <div className="table-scroll">
        {tab === "auctions" ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Seller</th>
                <th>Current bid</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {auctions.map((auction) => (
                <tr key={auction.id}>
                  <td>
                    <Link to="/auction/$auctionId" params={{ auctionId: auction.id }}>
                      {auction.title}
                    </Link>
                  </td>
                  <td>{auction.seller}</td>
                  <td>{money(auction.price)}</td>
                  <td>
                    <span className="status-pill">{auction.closed ? "Closed" : "Live"}</span>
                  </td>
                  <td>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={auction.closed}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Close ${auction.title}? This is demo-only and will not be saved.`,
                          )
                        ) {
                          closeAuction(auction.id);
                        }
                      }}
                    >
                      {auction.closed ? "Closed" : "Close auction (demo)"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : tab === "bids" ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Auction</th>
                <th>Bidder</th>
                <th>Amount</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {bids.map((bid) => (
                <tr key={bid.id}>
                  <td>{auctions.find((auction) => auction.id === bid.auctionId)?.title}</td>
                  <td>Private demo data</td>
                  <td>{money(bid.amount)}</td>
                  <td>{bid.date}</td>
                </tr>
              ))}
              {!bids.length && (
                <tr>
                  <td colSpan={4}>No bids in this account.</td>
                </tr>
              )}
            </tbody>
          </table>
        ) : tab === "users" ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Account</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Demo workspace</td>
                <td>No admin roles are configured</td>
              </tr>
            </tbody>
          </table>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Auctions</th>
              </tr>
            </thead>
            <tbody>
              {categories.slice(1).map((category) => (
                <tr key={category}>
                  <td>{category}</td>
                  <td>{auctions.filter((auction) => auction.category === category).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
