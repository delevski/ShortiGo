import { Play } from "lucide-react";
import { Route, Routes } from "react-router-dom";
import { AppShell } from "./app/AppShell";
import { AuthProvider } from "./app/AuthContext";
import { RequireAuth } from "./app/RequireAuth";
import { EmptyView } from "./components/EmptyView";
import { ToastProvider } from "./components/Toast";
import { LoginPage } from "./features/auth/LoginPage";
import { DiscoverPage } from "./features/discover/DiscoverPage";
import { FollowingPage } from "./features/my-list/FollowingPage";
import { MyListPage } from "./features/my-list/MyListPage";
import { ProfilePage } from "./features/profile/ProfilePage";
import { RewardsPage } from "./features/rewards/RewardsPage";
import { EpisodeRoutePage } from "./features/series/EpisodeRoutePage";
import { SeriesDetailPage } from "./features/series/SeriesDetailPage";
import { ShortsPage } from "./features/shorts/ShortsPage";
import { SubscribePage } from "./features/subscription/SubscribePage";

function TrendingScreen() {
  return (
    <section className="route-panel">
      <Play aria-hidden="true" size={28} />
      <h1>Trending</h1>
      <p>The next hot queue will land here without changing the shell.</p>
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
            <Route path="/explore" element={<DiscoverPage />} />
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/series/:seriesId" element={<SeriesDetailPage />} />
            <Route path="/series/:seriesId/episodes/:episodeId" element={<EpisodeRoutePage />} />
            <Route path="/trending" element={<TrendingScreen />} />
            <Route path="/following" element={<FollowingPage />} />
            <Route path="/rewards" element={<RewardsPage />} />
            <Route
              path="/my-list"
              element={
                <RequireAuth>
                  <MyListPage />
                </RequireAuth>
              }
            />
            <Route
              path="/wallet"
              element={
                <RequireAuth>
                  <ProfilePage />
                </RequireAuth>
              }
            />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/subscribe" element={<SubscribePage />} />
            <Route path="*" element={<EmptyView title="Nothing here yet" message="Try For You or Explore." />} />
          </Routes>
        </AppShell>
      </ToastProvider>
    </AuthProvider>
  );
}
