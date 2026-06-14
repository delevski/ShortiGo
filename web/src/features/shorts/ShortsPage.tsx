import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../app/AuthContext";
import { EmptyView } from "../../components/EmptyView";
import { ErrorView } from "../../components/ErrorView";
import { LoadingView } from "../../components/LoadingView";
import { useToast } from "../../components/Toast";
import { db, publicOrigin } from "../../firebase/firebase";
import {
  recordEpisodeShare,
  setEpisodeLiked,
  setSeriesFollowed,
  setSeriesSaved,
} from "../../repositories/socialRepository";
import { episodeAccess } from "../../shared/access";
import { episodeShareText } from "../../shared/share";
import { LockedEpisodeOverlay } from "./LockedEpisodeOverlay";
import { ShortsActionRail } from "./ShortsActionRail";
import { ShortsInfoPanel } from "./ShortsInfoPanel";
import { ShortsVideo } from "./ShortsVideo";
import { useShortsFeed } from "./useShortsFeed";

export function ShortsPage() {
  const { appUser, authUser, configReady, loginWithGoogle } = useAuth();
  const { episodes, error, loading, reload, seriesById } = useShortsFeed();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [index, setIndex] = useState(0);
  const [appliedDeepLink, setAppliedDeepLink] = useState<string | null>(null);
  const [pendingWalletNavigation, setPendingWalletNavigation] = useState(false);
  const lastWheelAtRef = useRef(0);
  const requestedSeriesId = searchParams.get("series");
  const requestedEpisodeId = searchParams.get("episode");

  const feedItems = useMemo(
    () =>
      episodes
        .map((episode) => {
          const series = seriesById.get(episode.seriesId);
          return series ? { episode, series } : null;
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item)),
    [episodes, seriesById],
  );

  useEffect(() => {
    setIndex((current) => Math.min(current, Math.max(0, feedItems.length - 1)));
  }, [feedItems.length]);

  useEffect(() => {
    if (!requestedSeriesId || !requestedEpisodeId || feedItems.length === 0) return;
    const requestedKey = `${requestedSeriesId}\u0000${requestedEpisodeId}`;
    if (appliedDeepLink === requestedKey) return;
    const requestedIndex = feedItems.findIndex(
      ({ episode, series }) => series.id === requestedSeriesId && episode.id === requestedEpisodeId,
    );
    if (requestedIndex >= 0) {
      setIndex(requestedIndex);
      setAppliedDeepLink(requestedKey);
    }
  }, [appliedDeepLink, feedItems, requestedEpisodeId, requestedSeriesId]);

  const move = useCallback(
    (delta: number) => {
      setIndex((current) => Math.min(Math.max(current + delta, 0), Math.max(0, feedItems.length - 1)));
    },
    [feedItems.length],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        move(1);
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        move(-1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [move]);

  useEffect(() => {
    if (!pendingWalletNavigation || !authUser) return;
    setPendingWalletNavigation(false);
    navigate("/wallet");
  }, [authUser, navigate, pendingWalletNavigation]);

  const activeItem = feedItems[index];
  const requireUser = useCallback(() => {
    if (!db || !authUser) {
      showToast("Login to save your shorts activity.", "info");
      return null;
    }
    return authUser.uid;
  }, [authUser, showToast]);

  const handleLogin = async () => {
    if (!configReady) {
      showToast("Firebase is not configured for login in this preview.", "error");
      return;
    }

    try {
      await loginWithGoogle();
      showToast("Welcome to ShortiGo.", "success");
    } catch (loginError) {
      showToast(loginError instanceof Error ? loginError.message : "Login failed.", "error");
    }
  };

  if (loading) {
    return (
      <section className="shorts-stage">
        <LoadingView title="Loading For You" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="shorts-stage">
        <ErrorView
          title="Unable to load shorts"
          message={error.message}
          action={
            <button className="state-view__button" type="button" onClick={reload}>
              Try again
            </button>
          }
        />
      </section>
    );
  }

  if (!activeItem) {
    return (
      <section className="shorts-stage">
        <EmptyView title="No shorts yet" message="Featured episodes will appear here once the catalog is ready." />
      </section>
    );
  }

  const { episode, series } = activeItem;
  const access = episodeAccess(episode, appUser);
  const liked = Boolean(appUser?.likedEpisodeIds.includes(episode.id));
  const saved = Boolean(appUser?.favoriteSeriesIds.includes(series.id));
  const followed = Boolean(appUser?.followedSeriesIds.includes(series.id));
  const unlocked = access.state === "open";

  const toggleLike = async () => {
    const userId = requireUser();
    if (!userId || !db) return;

    try {
      await setEpisodeLiked(db, userId, episode.id, !liked);
      await reload();
      showToast(liked ? "Removed like." : "Liked episode.", "success");
    } catch (likeError) {
      showToast(likeError instanceof Error ? likeError.message : "Unable to update like.", "error");
    }
  };

  const toggleSave = async () => {
    const userId = requireUser();
    if (!userId || !db) return;

    try {
      await setSeriesSaved(db, userId, series.id, !saved);
      await reload();
      showToast(saved ? "Removed from saved." : "Series saved.", "success");
    } catch (saveError) {
      showToast(saveError instanceof Error ? saveError.message : "Unable to update saved series.", "error");
    }
  };

  const toggleFollow = async () => {
    const userId = requireUser();
    if (!userId || !db) return;

    try {
      await setSeriesFollowed(db, userId, series.id, !followed);
      await reload();
      showToast(followed ? "Unfollowed series." : "Following series.", "success");
    } catch (followError) {
      showToast(followError instanceof Error ? followError.message : "Unable to update follow.", "error");
    }
  };

  const shareEpisode = async () => {
    const text = episodeShareText({
      episodeId: episode.id,
      episodeOrder: episode.order,
      origin: publicOrigin,
      route: "shorts",
      seriesId: series.id,
      seriesTitle: series.title,
    });

    try {
      if (navigator.share) {
        await navigator.share({ text, title: series.title });
      } else {
        await navigator.clipboard.writeText(text);
        showToast("Share link copied.", "success");
      }

      if (db) {
        await recordEpisodeShare(db, episode.id);
        await reload();
      }
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === "AbortError") return;
      showToast(shareError instanceof Error ? shareError.message : "Unable to share episode.", "error");
    }
  };

  return (
    <section
      className="shorts-stage"
      aria-label="For You shorts"
      onWheel={(event) => {
        if (Math.abs(event.deltaY) < 36) return;
        const now = Date.now();
        if (now - lastWheelAtRef.current < 420) return;
        lastWheelAtRef.current = now;
        move(event.deltaY > 0 ? 1 : -1);
      }}
    >
      <div className="shorts-card">
        <ShortsVideo active episode={episode} unlocked={unlocked} />
        <LockedEpisodeOverlay
          access={access}
          onLogin={handleLogin}
          onSubscribe={() => {
            if (!authUser) {
              if (configReady) setPendingWalletNavigation(true);
              void handleLogin();
              return;
            }
            showToast("VIP subscriptions will be handled from the wallet.", "info");
            navigate("/wallet");
          }}
          onUnlock={() => showToast("Episode unlocks are coming in the rewards task.", "info")}
        />
        <ShortsInfoPanel episode={episode} series={series} />
      </div>
      <ShortsActionRail
        episode={episode}
        followed={followed}
        liked={liked}
        onFollow={toggleFollow}
        onLike={toggleLike}
        onSave={toggleSave}
        onShare={shareEpisode}
        saved={saved}
        series={series}
      />
    </section>
  );
}
