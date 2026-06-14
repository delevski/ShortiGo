import { Crown, Lock, Play } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { EmptyView } from "../../components/EmptyView";
import { ErrorView } from "../../components/ErrorView";
import { LoadingView } from "../../components/LoadingView";
import type { Episode, Series } from "../../domain/types";
import { db, firebaseConfigError } from "../../firebase/firebase";
import { fetchEpisodesBySeriesId, fetchSeriesById } from "../../repositories/catalogRepository";
import { compactCount, durationLabel } from "../../shared/format";

const coverFallback = "/branding/splash_hero.png";

type SeriesDetailState = {
  episodes: Episode[];
  error: Error | null;
  loading: boolean;
  series: Series | null;
};

export function SeriesDetailPage() {
  const { seriesId } = useParams<{ seriesId: string }>();
  const [state, setState] = useState<SeriesDetailState>({
    episodes: [],
    error: null,
    loading: Boolean(db && seriesId),
    series: null,
  });

  useEffect(() => {
    if (!db || !seriesId) {
      setState({ episodes: [], error: null, loading: false, series: null });
      return;
    }

    let active = true;
    setState((current) => ({ ...current, error: null, loading: true }));

    Promise.all([fetchSeriesById(db, seriesId), fetchEpisodesBySeriesId(db, seriesId)])
      .then(([series, episodes]) => {
        if (active) {
          setState({
            episodes: series?.isPublished ? episodes : [],
            error: null,
            loading: false,
            series: series?.isPublished ? series : null,
          });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setState({
            episodes: [],
            error: error instanceof Error ? error : new Error("Unable to load series."),
            loading: false,
            series: null,
          });
        }
      });

    return () => {
      active = false;
    };
  }, [seriesId]);

  const totalDuration = useMemo(
    () =>
      state.series?.totalDurationSec
        ? durationLabel(state.series.totalDurationSec)
        : durationLabel(state.episodes.reduce((total, episode) => total + episode.durationSec, 0)),
    [state.episodes, state.series?.totalDurationSec],
  );

  if (!db) {
    return (
      <section className="series-detail-page">
        <ErrorView
          title="Series needs Firebase"
          message={
            firebaseConfigError
              ? `Missing ${firebaseConfigError}. Add Firebase env values to load series details.`
              : "Firebase is not configured for this preview."
          }
        />
      </section>
    );
  }

  if (state.loading) {
    return (
      <section className="series-detail-page">
        <LoadingView title="Loading series" />
      </section>
    );
  }

  if (state.error) {
    return (
      <section className="series-detail-page">
        <ErrorView title="Unable to load series" message={state.error.message} />
      </section>
    );
  }

  if (!state.series) {
    return (
      <section className="series-detail-page">
        <EmptyView title="Series not found" message="This series may be unpublished or unavailable." />
      </section>
    );
  }

  const { series } = state;

  return (
    <section className="series-detail-page" aria-labelledby="series-title">
      <div className="series-detail-hero">
        <div className="series-detail-hero__cover">
          <img
            src={series.coverUrl || coverFallback}
            alt=""
            onError={(event) => {
              event.currentTarget.src = coverFallback;
            }}
          />
        </div>
        <div className="series-detail-hero__copy">
          <div className="series-detail-hero__meta">
            {series.isVip ? (
              <span className="vip-chip">
                <Crown aria-hidden="true" size={14} />
                VIP
              </span>
            ) : null}
            <span>{series.episodeCount} episodes</span>
            <span>{totalDuration}</span>
            <span>{compactCount(series.followerCount)} followers</span>
          </div>
          <h1 id="series-title">{series.title}</h1>
          <p>{series.description || "Short episodes ready to stream."}</p>
        </div>
      </div>

      <div className="episode-list" aria-label={`${series.title} episodes`}>
        <div className="episode-list__header">
          <h2>Episodes</h2>
          <span>{state.episodes.length}</span>
        </div>
        {state.episodes.length === 0 ? (
          <EmptyView title="No episodes yet" message="Episodes for this series will appear here." />
        ) : (
          state.episodes.map((episode) => (
            <Link
              className="episode-row"
              key={episode.id}
              to={`/series/${series.id}/episodes/${episode.id}`}
            >
              <span className="episode-row__thumb">
                <img
                  src={episode.thumbnailUrl || series.coverUrl || coverFallback}
                  alt=""
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.src = coverFallback;
                  }}
                />
                <Play aria-hidden="true" size={16} fill="currentColor" />
              </span>
              <span className="episode-row__copy">
                <strong>Episode {episode.order}</strong>
                <span>
                  {durationLabel(episode.durationSec)} · {compactCount(episode.watchCount)} views
                </span>
              </span>
              {episode.isVipLocked ? (
                <span className="episode-row__badge">
                  <Lock aria-hidden="true" size={13} />
                  VIP
                </span>
              ) : null}
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
