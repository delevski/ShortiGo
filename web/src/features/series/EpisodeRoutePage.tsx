import { ArrowLeft, Crown } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { EmptyView } from "../../components/EmptyView";
import { ErrorView } from "../../components/ErrorView";
import { LoadingView } from "../../components/LoadingView";
import type { Episode, Series } from "../../domain/types";
import { db, firebaseConfigError } from "../../firebase/firebase";
import { fetchEpisodeById, fetchSeriesById } from "../../repositories/catalogRepository";
import { durationLabel } from "../../shared/format";
import { ShortsVideo } from "../shorts/ShortsVideo";

type EpisodeRouteState = {
  episode: Episode | null;
  error: Error | null;
  loading: boolean;
  series: Series | null;
};

export function EpisodeRoutePage() {
  const { episodeId, seriesId } = useParams<{ episodeId: string; seriesId: string }>();
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
        const matchedEpisode = episode?.seriesId === seriesId ? episode : null;
        if (active) setState({ episode: matchedEpisode, error: null, loading: false, series });
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

  return (
    <section className="direct-player-page" aria-labelledby="episode-title">
      <div className="direct-player">
        <div className="shorts-card direct-player__video">
          <ShortsVideo active episode={state.episode} unlocked={true} />
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
