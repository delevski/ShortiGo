import { Gift, Lock, Play, Search, Wallet } from "lucide-react";
import { Route, Routes } from "react-router-dom";
import { AppShell } from "./app/AppShell";
import { AuthProvider, useAuth } from "./app/AuthContext";
import { RequireAuth } from "./app/RequireAuth";
import { EmptyView } from "./components/EmptyView";
import { ErrorView } from "./components/ErrorView";
import { LoadingView } from "./components/LoadingView";
import { ToastProvider } from "./components/Toast";

function FeedScreen() {
  const { configReady, error, loading } = useAuth();

  return (
    <section className="feed-screen">
      <div className="feed-rail" aria-label="For You preview">
        <article className="short-card short-card--hero">
          <div className="short-card__media">
            <img src="/branding/splash_hero.png" alt="" />
            <button className="play-button" type="button" aria-label="Play featured short">
              <Play aria-hidden="true" size={24} fill="currentColor" />
            </button>
          </div>
          <div className="short-card__copy">
            <span>For You</span>
            <h1>Bite-sized drama, unlocked in coins.</h1>
            <p>Follow the feed, stack daily rewards, and keep your favorite series close.</p>
          </div>
        </article>
        <article className="reward-panel">
          <Gift aria-hidden="true" size={22} />
          <div>
            <h2>Daily rewards</h2>
            <p>Wallet, unlocks, and check-ins are ready for the next task.</p>
          </div>
        </article>
      </div>

      <aside className="feed-status">
        {loading ? <LoadingView title="Checking account" /> : null}
        {!loading && error ? <ErrorView title="Auth status" message={error.message} /> : null}
        {!loading && !error && !configReady ? (
          <ErrorView title="Local preview mode" message="Firebase env values are missing, so login is disabled." />
        ) : null}
        {!loading && !error && configReady ? (
          <EmptyView title="Ready for content" message="Catalog routes can plug into this shell next." />
        ) : null}
      </aside>
    </section>
  );
}

function ExploreScreen() {
  return (
    <section className="route-panel">
      <Search aria-hidden="true" size={28} />
      <h1>Explore</h1>
      <p>Browse categories, trending shorts, and creator collections from here.</p>
    </section>
  );
}

function TrendingScreen() {
  return (
    <section className="route-panel">
      <Play aria-hidden="true" size={28} />
      <h1>Trending</h1>
      <p>The next hot queue will land here without changing the shell.</p>
    </section>
  );
}

function LibraryScreen() {
  return (
    <section className="route-panel">
      <Lock aria-hidden="true" size={28} />
      <h1>Library</h1>
      <p>Saved, unlocked, and followed series will be protected behind auth.</p>
    </section>
  );
}

function WalletScreen() {
  return (
    <section className="route-panel">
      <Wallet aria-hidden="true" size={28} />
      <h1>Wallet</h1>
      <p>Coins, bonus balance, and transactions will appear here.</p>
    </section>
  );
}

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<FeedScreen />} />
            <Route path="/explore" element={<ExploreScreen />} />
            <Route path="/trending" element={<TrendingScreen />} />
            <Route
              path="/library"
              element={
                <RequireAuth>
                  <LibraryScreen />
                </RequireAuth>
              }
            />
            <Route
              path="/wallet"
              element={
                <RequireAuth>
                  <WalletScreen />
                </RequireAuth>
              }
            />
            <Route path="*" element={<EmptyView title="Nothing here yet" message="Try For You or Explore." />} />
          </Routes>
        </AppShell>
      </ToastProvider>
    </AuthProvider>
  );
}
