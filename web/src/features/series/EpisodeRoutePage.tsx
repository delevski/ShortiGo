import { ArrowLeft, Crown } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../app/AuthContext";
import { EmptyView } from "../../components/EmptyView";
import { ErrorView } from "../../components/ErrorView";
import { LoadingView } from "../../components/LoadingView";
import { useToast } from "../../components/Toast";
import type { Episode, Series } from "../../domain/types";
import { db, firebaseConfigError } from "../../firebase/firebase";
import { fetchEpisodeById, fetchSeriesById } from "../../repositories/catalogRepository";
import { episodeAccess } from "../../shared/access";
import { durationLabel } from "../../shared/format";
import { LockedEpisodeOverlay } from "../shorts/LockedEpisodeOverlay";
import { ShortsVideo } from "../shorts/ShortsVideo";

type EpisodeRouteState = {
  episode: Episode | null;
  error: Error | null;
  loading: boolean;
  series: Series | null;
};

export function EpisodeRoutePage() {
  const { appUser, authUser, configReady, loginWithGoogle } = useAuth();
  const { episodeId, seriesId } = useParams<{ episodeId: string; seriesId: string }>();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const pendingWalletNavigationRef = useRef(false);
  const [state, setState] = useState<EpisodeRouteState>({
    episode: null,
    error: null,
    loading: Boolean(db && episodeId && seriesId),
    series: null,
  });

  useEffect(() => {
    if (!db || !episodeId || !seriesId) {
      setState({ episode: null, error: null, loading: false, series: null });
      return;
    }

    let active = true;
    setState((current) => ({ ...current, error: null, loading: true }));

    Promise.all([fetchSeriesById(db, seriesId), fetchEpisodeById(db, episodeId)])
      .then(([series, episode]) => {
        const publishedSeries = series?.isPublished ? series : null;
        const matchedEpisode = publishedSeries && episode?.seriesId === seriesId ? episode : null;
        if (active) setState({ episode: matchedEpisode, error: null, loading: false, series: publishedSeries });
      })
      .catch((error: unknown) => {
        if (active) {
          setState({
            episode: null,
            error: error instanceof Error ? error : new Error("Unable to load episode."),
            loading: false,
            series: null,
          });
        }
      });

    return () => {
      active = false;
    };
  }, [episodeId, seriesId]);

  useEffect(() => {
    if (!pendingWalletNavigationRef.current || !authUser) return;
    pendingWalletNavigationRef.current = false;
    navigate("/wallet");
  }, [authUser, navigate]);

  const handleLogin = async () => {
    if (!configReady) {
      showToast("Firebase is not configured for login in this preview.", "error");
      return;
    }

    try {
      await loginWithGoogle();
      showToast("Welcome to ShortiGo.", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Login failed.", "error");
    }
  };

  if (!db) {
    return (
      <section className="direct-player-page">
        <ErrorView
          title="Player needs Firebase"
          message={
            firebaseConfigError
              ? `Missing ${firebaseConfigError}. Add Firebase env values to load this episode.`
              : "Firebase is not configured for this preview."
          }
        />
      </section>
    );
  }

  if (state.loading) {
    return (
      <section className="direct-player-page">
        <LoadingView title="Loading episode" />
      </section>
    );
  }

  if (state.error) {
    return (
      <section className="direct-player-page">
        <ErrorView title="Unable to load episode" message={state.error.message} />
      </section>
    );
  }

  if (!state.series || !state.episode) {
    return (
      <section className="direct-player-page">
        <EmptyView title="Episode not found" message="This episode may be unavailable or moved." />
      </section>
    );
  }

  const access = episodeAccess(state.episode, appUser);
  const unlocked = access.state === "open";

  return (
    <section className="direct-player-page" aria-labelledby="episode-title">
      <div className="direct-player">
        <div className="shorts-card direct-player__video">
          <ShortsVideo active episode={state.episode} unlocked={unlocked} />
          <LockedEpisodeOverlay
            access={access}
            onLogin={handleLogin}
            onSubscribe={() => {
              if (!authUser) {
                if (configReady) pendingWalletNavigationRef.current = true;
                void handleLogin();
                return;
              }
              showToast("VIP subscriptions will be handled from the wallet.", "info");
              navigate("/wallet");
            }}
            onUnlock={() => showToast("Episode unlocks are coming in the rewards task.", "info")}
          />
        </div>
        <aside className="direct-player__details">
          <Link className="back-link" to={`/series/${state.series.id}`}>
            <ArrowLeft aria-hidden="true" size={17} />
            {state.series.title}
          </Link>
          <div className="direct-player__heading">
            {state.series.isVip ? (
              <span className="vip-chip">
                <Crown aria-hidden="true" size={14} />
                VIP
              </span>
            ) : null}
            <h1 id="episode-title">Episode {state.episode.order}</h1>
            <p>{state.series.description || "Now playing on ShortiGo."}</p>
          </div>
          <dl className="direct-player__stats">
            <div>
              <dt>Duration</dt>
              <dd>{durationLabel(state.episode.durationSec)}</dd>
            </div>
            <div>
              <dt>Series</dt>
              <dd>{state.series.title}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  );
}
