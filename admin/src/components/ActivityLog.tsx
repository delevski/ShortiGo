import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "../firebase";
import type { AuditAction } from "../lib/auditLog";
import { logError } from "../lib/logger";

type AuditRow = {
  id: string;
  action: string;
  actorUid: string;
  actorEmail: string | null;
  role: string;
  providerId: string | null;
  targetType: string;
  targetId: string | null;
  seriesId: string | null;
  metadata: Record<string, unknown>;
  createdAtLabel: string;
};

const ACTION_OPTIONS: AuditAction[] = [
  "auth.sign_in",
  "episode.publish",
  "episode.replace",
  "series.create",
  "series.update",
  "media.delete",
  "provider.create",
  "provider.link_user",
  "provider.deactivate",
  "provider.update",
  "upload.cloudinary.success",
  "upload.cloudinary.failure",
];

function formatTimestamp(value: unknown): string {
  if (value && typeof value === "object" && "toDate" in value) {
    const date = (value as { toDate: () => Date }).toDate();
    return date.toLocaleString();
  }
  return "—";
}

export function ActivityLog() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [providerFilter, setProviderFilter] = useState("");

  const load = useCallback(async () => {
    if (!db) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const constraints: QueryConstraint[] = [
        orderBy("createdAt", "desc"),
        limit(200),
      ];
      if (actionFilter) {
        constraints.unshift(where("action", "==", actionFilter));
      } else if (providerFilter) {
        constraints.unshift(where("providerId", "==", providerFilter));
      }
      const snap = await getDocs(
        query(collection(db, "auditEvents"), ...constraints),
      );
      const parsed: AuditRow[] = snap.docs.map((item) => {
        const data = item.data();
        return {
          id: item.id,
          action: typeof data.action === "string" ? data.action : "unknown",
          actorUid: typeof data.actorUid === "string" ? data.actorUid : "",
          actorEmail:
            typeof data.actorEmail === "string" ? data.actorEmail : null,
          role: typeof data.role === "string" ? data.role : "",
          providerId:
            typeof data.providerId === "string" ? data.providerId : null,
          targetType:
            typeof data.targetType === "string" ? data.targetType : "",
          targetId: typeof data.targetId === "string" ? data.targetId : null,
          seriesId: typeof data.seriesId === "string" ? data.seriesId : null,
          metadata:
            data.metadata && typeof data.metadata === "object"
              ? (data.metadata as Record<string, unknown>)
              : {},
          createdAtLabel: formatTimestamp(data.createdAt),
        };
      });
      setRows(parsed);
    } catch (error) {
      logError("Failed to load activity log", error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [actionFilter, providerFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const providerIds = useMemo(() => {
    const ids = new Set<string>();
    for (const row of rows) {
      if (row.providerId) {
        ids.add(row.providerId);
      }
    }
    return [...ids].sort();
  }, [rows]);

  return (
    <div className="activity-log">
      <section className="card">
        <div className="library__header">
          <div>
            <h2 className="section-title">Activity log</h2>
            <p className="hint">
              Append-only trace of uploads, publishes, deletes, and provider
              admin actions (latest 200 events).
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

        <div className="field-grid activity-log__filters">
          <label className="field">
            <span className="field__label">Action</span>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setProviderFilter("");
              }}
            >
              <option value="">All actions</option>
              {ACTION_OPTIONS.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field__label">Provider</span>
            <select
              value={providerFilter}
              onChange={(e) => {
                setProviderFilter(e.target.value);
                setActionFilter("");
              }}
            >
              <option value="">All providers</option>
              {providerIds.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="card">
        {loading ? (
          <p className="hint">Loading events…</p>
        ) : rows.length === 0 ? (
          <p className="hint">No events yet.</p>
        ) : (
          <ul className="activity-list">
            {rows.map((row) => (
              <li key={row.id} className="activity-list__item">
                <div className="activity-list__meta">
                  <time>{row.createdAtLabel}</time>
                  <code className="activity-list__action">{row.action}</code>
                  <span className="badge">{row.role}</span>
                  {row.providerId ? (
                    <span className="chip">{row.providerId}</span>
                  ) : null}
                </div>
                <p className="activity-list__actor">
                  {row.actorEmail ?? row.actorUid}
                </p>
                <p className="activity-list__target">
                  {row.targetType}
                  {row.targetId ? ` · ${row.targetId}` : ""}
                  {row.seriesId ? ` · series ${row.seriesId}` : ""}
                </p>
                {Object.keys(row.metadata).length > 0 ? (
                  <pre className="activity-list__metadata">
                    {JSON.stringify(row.metadata, null, 2)}
                  </pre>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
