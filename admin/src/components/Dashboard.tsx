import { useCallback, useEffect, useState } from "react";
import {
  loadDashboardMetrics,
  type DashboardMetrics,
} from "../lib/dashboardMetrics";
import { logError } from "../lib/logger";
import type { StudioAccess } from "../lib/studioAccess";

type DashboardProps = {
  scopeProviderId?: string | null;
  studioAccess: StudioAccess | null;
};

function formatDuration(totalSec: number): string {
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} min`;
}

export function Dashboard({ scopeProviderId, studioAccess }: DashboardProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loadDashboardMetrics(scopeProviderId);
      setMetrics(data);
      setLastRefresh(new Date());
    } catch (error) {
      logError("Failed to load dashboard", error);
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }, [scopeProviderId]);

  useEffect(() => {
    void load();
  }, [load]);

  const isProvider = studioAccess?.role === "provider";

  return (
    <div className="dashboard">
      <section className="card">
        <div className="library__header">
          <div>
            <h2 className="section-title">Dashboard</h2>
            <p className="hint">
              {isProvider
                ? "Overview of your catalog and recent publishes."
                : "Catalog overview, provider breakdown, and recent activity."}
              {lastRefresh ? (
                <>
                  {" "}
                  Last updated {lastRefresh.toLocaleTimeString()}.
                </>
              ) : null}
            </p>
          </div>
          <button
            type="button"
            className="btn btn--ghost"
            disabled={loading}
            onClick={() => void load()}
          >
            Refresh
          </button>
        </div>
      </section>

      {loading ? (
        <section className="card">
          <p className="hint">Loading metrics…</p>
        </section>
      ) : metrics ? (
        <>
          <section className="card dashboard__cards">
            <div className="dashboard__card">
              <span className="dashboard__card-label">Series</span>
              <strong className="dashboard__card-value">{metrics.seriesCount}</strong>
            </div>
            <div className="dashboard__card">
              <span className="dashboard__card-label">Episodes</span>
              <strong className="dashboard__card-value">{metrics.episodeCount}</strong>
            </div>
            <div className="dashboard__card">
              <span className="dashboard__card-label">Total runtime</span>
              <strong className="dashboard__card-value">
                {formatDuration(metrics.totalDurationSec)}
              </strong>
            </div>
            <div className="dashboard__card">
              <span className="dashboard__card-label">VIP series</span>
              <strong className="dashboard__card-value">{metrics.vipSeriesCount}</strong>
            </div>
            <div className="dashboard__card">
              <span className="dashboard__card-label">In For You</span>
              <strong className="dashboard__card-value">
                {metrics.featuredSeriesCount}
              </strong>
            </div>
          </section>

          {!isProvider && metrics.byProvider.length > 0 ? (
            <section className="card">
              <h3 className="section-title">By provider</h3>
              <ul className="dashboard__provider-list">
                {metrics.byProvider.map((row) => (
                  <li key={row.providerId}>
                    <code>{row.providerId}</code>
                    <span>
                      {row.seriesCount} series · {row.episodeCount} episodes
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="card">
            <h3 className="section-title">Recent publishes</h3>
            {metrics.recentPublishes.length === 0 ? (
              <p className="hint">No publish events yet.</p>
            ) : (
              <ul className="activity-list">
                {metrics.recentPublishes.map((row) => (
                  <li key={row.id} className="activity-list__item">
                    <p className="activity-list__target">
                      {row.targetId ?? "episode"}
                      {row.seriesId ? ` · ${row.seriesId}` : ""}
                    </p>
                    <p className="activity-list__actor">
                      {row.actorEmail ?? "—"} · {row.createdAtLabel}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : (
        <section className="card">
          <p className="hint">Could not load dashboard.</p>
        </section>
      )}
    </div>
  );
}
