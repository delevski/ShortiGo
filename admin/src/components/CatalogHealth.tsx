import { useCallback, useState } from "react";
import {
  repairSeriesStats,
  scanCatalogHealth,
  type HealthIssue,
} from "../lib/catalogHealth";
import { logError } from "../lib/logger";
import { useToast } from "./ToastStack";

type CatalogHealthProps = {
  scopeProviderId?: string | null;
  canRepair: boolean;
};

export function CatalogHealth({
  scopeProviderId,
  canRepair,
}: CatalogHealthProps) {
  const toast = useToast();
  const [issues, setIssues] = useState<HealthIssue[]>([]);
  const [scannedSeries, setScannedSeries] = useState(0);
  const [scannedEpisodes, setScannedEpisodes] = useState(0);
  const [loading, setLoading] = useState(false);
  const [repairingId, setRepairingId] = useState<string | null>(null);

  const runScan = useCallback(async () => {
    setLoading(true);
    try {
      const result = await scanCatalogHealth(scopeProviderId);
      setIssues(result.issues);
      setScannedSeries(result.scannedSeries);
      setScannedEpisodes(result.scannedEpisodes);
    } catch (error) {
      logError("Health scan failed", error);
      toast.error("Scan failed", String(error));
    } finally {
      setLoading(false);
    }
  }, [scopeProviderId, toast]);

  async function handleRepair(seriesId: string) {
    if (!canRepair) {
      return;
    }
    setRepairingId(seriesId);
    try {
      await repairSeriesStats(seriesId);
      toast.success("Repaired", `Synced stats for ${seriesId}.`);
      await runScan();
    } catch (error) {
      toast.error("Repair failed", String(error));
    } finally {
      setRepairingId(null);
    }
  }

  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warn");

  return (
    <div className="catalog-health">
      <section className="card">
        <div className="library__header">
          <div>
            <h2 className="section-title">Catalog health</h2>
            <p className="hint">
              Scans URLs, episode counts, duplicate orders, and For You conflicts.
              Repair re-syncs series episodeCount from Firestore episodes.
            </p>
          </div>
          <button
            type="button"
            className="btn btn--primary"
            disabled={loading}
            onClick={() => void runScan()}
          >
            {loading ? "Scanning…" : "Run scan"}
          </button>
        </div>
        {scannedSeries > 0 || scannedEpisodes > 0 ? (
          <p className="hint">
            Scanned {scannedSeries} series and {scannedEpisodes} episodes.
          </p>
        ) : null}
      </section>

      {issues.length > 0 ? (
        <>
          {errors.length > 0 ? (
            <section className="card">
              <h3 className="section-title">Errors ({errors.length})</h3>
              <HealthIssueList
                issues={errors}
                canRepair={canRepair}
                repairingId={repairingId}
                onRepair={(id) => void handleRepair(id)}
              />
            </section>
          ) : null}
          {warnings.length > 0 ? (
            <section className="card">
              <h3 className="section-title">Warnings ({warnings.length})</h3>
              <HealthIssueList
                issues={warnings}
                canRepair={canRepair}
                repairingId={repairingId}
                onRepair={(id) => void handleRepair(id)}
              />
            </section>
          ) : null}
        </>
      ) : scannedSeries > 0 ? (
        <section className="card card--info">
          <p className="hint">No issues found.</p>
        </section>
      ) : null}
    </div>
  );
}

function HealthIssueList({
  issues,
  canRepair,
  repairingId,
  onRepair,
}: {
  issues: HealthIssue[];
  canRepair: boolean;
  repairingId: string | null;
  onRepair: (seriesId: string) => void;
}) {
  return (
    <ul className="health-list">
      {issues.map((issue) => (
        <li key={issue.id} className={`health-list__item health-list__item--${issue.severity}`}>
          <span className="chip">{issue.category}</span>
          <p>{issue.message}</p>
          {canRepair &&
          issue.category === "series_stats" &&
          issue.seriesId ? (
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              disabled={repairingId === issue.seriesId}
              onClick={() => onRepair(issue.seriesId!)}
            >
              {repairingId === issue.seriesId ? "Repairing…" : "Repair stats"}
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
