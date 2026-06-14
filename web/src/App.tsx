import { Lock, Play, Search, Wallet } from "lucide-react";
import { Route, Routes } from "react-router-dom";
import { AppShell } from "./app/AppShell";
import { AuthProvider } from "./app/AuthContext";
import { RequireAuth } from "./app/RequireAuth";
import { EmptyView } from "./components/EmptyView";
import { ToastProvider } from "./components/Toast";
import { ShortsPage } from "./features/shorts/ShortsPage";

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
            <Route path="/" element={<ShortsPage />} />
            <Route path="/shorts" element={<ShortsPage />} />
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
