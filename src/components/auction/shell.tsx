import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, ChevronDown, Gavel, Plus, ShieldCheck, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { useAuctions } from "./store";

export function AuctionShell({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authDialogError, setAuthDialogError] = useState<string | null>(null);
  const { user, loading, error, reportError } = useAuctions();

  const signInWithGoogle = async () => {
    const result = await authClient.signIn.social({
      provider: "google",
      callbackURL: window.location.href,
    });
    if (result.error) reportError(result.error.message || "Google sign-in failed.");
  };

  const submitEmailAuth = async () => {
    setAuthDialogError(null);
    setAuthBusy(true);
    try {
      if (authMode === "sign-up") {
        const result = await authClient.signUp.email({
          email: email.trim(),
          password,
          name: name.trim() || email.split("@")[0] || "Bidder",
        });
        if (result.error) {
          setAuthDialogError(result.error.message || "Sign-up failed.");
          return;
        }
      } else {
        const result = await authClient.signIn.email({
          email: email.trim(),
          password,
        });
        if (result.error) {
          setAuthDialogError(result.error.message || "Sign-in failed.");
          return;
        }
      }
      setAuthOpen(false);
      window.location.reload();
    } catch {
      setAuthDialogError("Could not reach the server. Run npm run dev and try again.");
    } finally {
      setAuthBusy(false);
    }
  };

  const signOut = async () => {
    const result = await authClient.signOut();
    if (result.error) {
      reportError(result.error.message || "Sign-out failed.");
      return;
    }
    window.location.assign("/");
  };

  const initials = user?.name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <header className="site-header">
        <Link to="/" className="brand">
          <Gavel strokeWidth={2.4} />
          bidwell<span>.</span>
        </Link>
        <nav className="main-nav">
          <Link to="/" activeOptions={{ exact: true }}>
            Browse auctions
          </Link>
          <Link to="/my-bids">My bids</Link>
          <Link to="/watchlist">Watchlist</Link>
        </nav>
        <div className="header-actions">
          <Button asChild className="sell-header">
            <Link to="/sell">
              <Plus />
              Sell an item
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Notifications"
            aria-label="Notifications"
            onClick={() => setNotifications(true)}
          >
            <Bell />
          </Button>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="px-1" aria-label="Account menu">
                  <span className="avatar">{initials}</span>
                  <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled>
                  {user.name} · {user.email}
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/my-bids">My bidding activity</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/sell">Seller workspace</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/admin">Administrator demo workspace</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void signOut()}>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={() => {
                setAuthDialogError(null);
                setAuthOpen(true);
              }}
              disabled={loading}
            >
              Sign in
            </Button>
          )}
        </div>
      </header>
      {error && (
        <div
          role="alert"
          className="mx-auto my-3 flex max-w-7xl items-center justify-between gap-3 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm"
        >
          <span>{error}</span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Dismiss error"
            onClick={() => reportError("")}
          >
            <X size={16} />
          </Button>
        </div>
      )}
      {children}
      <footer className="site-footer">
        <span>© 2026 Bidwell. A little discovery. A great deal.</span>
        <span>
          <ShieldCheck size={14} />
          Email or Google sign-in · MySQL-backed bids · No payments
        </span>
      </footer>
      <Dialog open={notifications} onOpenChange={setNotifications}>
        <DialogContent>
          <DialogTitle>Notifications</DialogTitle>
          <DialogDescription>
            You&apos;re all caught up. Auction updates will appear here.
          </DialogDescription>
        </DialogContent>
      </Dialog>
      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle>{authMode === "sign-in" ? "Sign in" : "Create an account"}</DialogTitle>
          <DialogDescription>
            Use email and password, or continue with Google if you configured OAuth in `.env`.
          </DialogDescription>
          <div className="grid gap-3 py-2">
            {authMode === "sign-up" && (
              <div className="grid gap-1.5">
                <Label htmlFor="auth-name">Name</Label>
                <Input
                  id="auth-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                />
              </div>
            )}
            <div className="grid gap-1.5">
              <Label htmlFor="auth-email">Email</Label>
              <Input
                id="auth-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="auth-password">Password</Label>
              <Input
                id="auth-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={authMode === "sign-in" ? "current-password" : "new-password"}
              />
            </div>
            {authDialogError && (
              <p role="alert" className="text-sm text-destructive">
                {authDialogError}
              </p>
            )}
            <Button
              onClick={() => void submitEmailAuth()}
              disabled={authBusy || !email.trim() || password.length < 8}
            >
              {authMode === "sign-in" ? "Sign in with email" : "Create account"}
            </Button>
            <p className="text-xs text-muted-foreground">Password must be at least 8 characters.</p>
            <Button variant="outline" onClick={() => void signInWithGoogle()} disabled={authBusy}>
              Continue with Google (optional)
            </Button>
            <Button
              variant="link"
              className="h-auto p-0"
              onClick={() => {
                setAuthDialogError(null);
                setAuthMode(authMode === "sign-in" ? "sign-up" : "sign-in");
              }}
            >
              {authMode === "sign-in"
                ? "Need an account? Sign up"
                : "Already have an account? Sign in"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
