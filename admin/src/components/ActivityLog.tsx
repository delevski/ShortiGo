import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import type { AuditAction } from "../lib/auditLog";
import { fetchProviders } from "../lib/providersFirestore";
import { logError } from "../lib/logger";
import { useToast } from "./ToastStack";

const PAGE_SIZE = 50;

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

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

type ActivityLogProps = {
  scopeProviderId?: string | null;
};

export function ActivityLog({ scopeProviderId = null }: ActivityLogProps) {
  const toast = useToast();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [actionFilter, setActionFilter] = useState("");
  const [providerFilter, setProviderFilter] = useState("");
  const [providerOptions, setProviderOptions] = useState<string[]>([]);
  const lastDocRef = useRef<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (scopeProviderId) {
      setProviderFilter(scopeProviderId);
      setProviderOptions([scopeProviderId]);
      return;
    }
    void fetchProviders().then((providers) => {
      setProviderOptions(providers.map((p) => p.id).sort());
    });
  }, [scopeProviderId]);

  const buildQuery = useCallback(
    (pageAfter?: QueryDocumentSnapshot | null) => {
      const constraints: QueryConstraint[] = [orderBy("createdAt", "desc")];
      const effectiveProvider = scopeProviderId ?? providerFilter;
      if (actionFilter) {
        constraints.unshift(where("action", "==", actionFilter));
      }
      if (effectiveProvider) {
        constraints.unshift(where("providerId", "==", effectiveProvider));
      }
      constraints.push(limit(PAGE_SIZE));
      if (pageAfter) {
        constraints.push(startAfter(pageAfter));
      }
      return query(collection(db!, "auditEvents"), ...constraints);
    },
    [actionFilter, providerFilter, scopeProviderId],
  );

  const parseRows = (docs: QueryDocumentSnapshot[]): AuditRow[] =>
    docs.map((item) => {
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

  const load = useCallback(
    async (append = false) => {
      if (!db) {
        setRows([]);
        setLoading(false);
        return;
      }
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        lastDocRef.current = null;
      }
      try {
        const snap = await getDocs(
          buildQuery(append ? lastDocRef.current : null),
        );
        const parsed = parseRows(snap.docs);
        setRows((prev) => (append ? [...prev, ...parsed] : parsed));
        lastDocRef.current =
          snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
        setHasMore(snap.docs.length >= PAGE_SIZE);
        setLoadError(null);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);
        logError("Failed to load activity log", error);
        setLoadError(message);
        if (!append) {
          setRows([]);
        }
        toast.error(
          "Activity log failed",
          message.includes("permission-denied")
            ? `${message} — confirm adminUsers/{yourUid} exists and Firestore rules are deployed.`
            : message.includes("failed-precondition")
              ? `${message} — run: firebase deploy --only firestore:indexes`
              : message,
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [buildQuery, toast],
  );

  useEffect(() => {
    void load(false);
  }, [load]);

  const exportCsv = useCallback(() => {
    const header = [
      "createdAt",
      "action",
      "role",
      "providerId",
      "actorEmail",
      "targetType",
      "targetId",
      "seriesId",
      "metadata",
    ];
    const lines = [
      header.join(","),
      ...rows.map((row) =>
        [
          row.createdAtLabel,
          row.action,
          row.role,
          row.providerId ?? "",
          row.actorEmail ?? row.actorUid,
          row.targetType,
          row.targetId ?? "",
          row.seriesId ?? "",
          JSON.stringify(row.metadata),
        ]
          .map((cell) => escapeCsv(String(cell)))
          .join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `shortigo-activity-${Date.now()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [rows]);

  const filterHint = useMemo(() => {
    if (scopeProviderId) {
      return "Showing activity for your provider account.";
    }
    if (actionFilter && providerFilter) {
      return `Filtered by action and provider (${rows.length} loaded).`;
    }
    return `${rows.length} event(s) loaded.`;
  }, [scopeProviderId, actionFilter, providerFilter, rows.length]);

  return (
    <div className="activity-log">
      <section className="card">
        <div className="library__header">
          <div>
            <h2 className="section-title">Activity log</h2>
            <p className="hint">{filterHint}</p>
          </div>
          <div className="library__header-actions">
            <button
              type="button"
              className="btn btn--ghost"
              disabled={loading || rows.length === 0}
              onClick={exportCsv}
            >
              Export CSV
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              disabled={loading}
              onClick={() => void load(false)}
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="field-grid activity-log__filters">
          <label className="field">
            <span className="field__label">Action</span>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="">All actions</option>
              {ACTION_OPTIONS.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </label>
          {!scopeProviderId ? (
            <label className="field">
              <span className="field__label">Provider</span>
              <select
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
              >
                <option value="">All providers</option>
                {providerOptions.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      </section>

      <section className="card">
        {loadError ? (
          <p className="library__warn">
            Could not load events: {loadError}. Super-admins need{" "}
            <code>adminUsers/{"{uid}"}</code> and deployed rules/indexes.
          </p>
        ) : null}
        {loading ? (
          <p className="hint">Loading events…</p>
        ) : rows.length === 0 ? (
          <p className="hint">
            No events yet. Sign in again to write <code>auth.sign_in</code>, or
            publish/delete content after rules were fixed.
          </p>
        ) : (
          <>
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
            {hasMore ? (
              <button
                type="button"
                className="btn btn--ghost"
                disabled={loadingMore}
                onClick={() => void load(true)}
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
