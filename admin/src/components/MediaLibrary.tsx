import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  deleteEpisodeFromCatalog,
  deleteEpisodesFromCatalog,
  deleteSeriesFromCatalog,
  type CatalogEpisode,
  type CatalogSeriesGroup,
} from "../lib/firestoreCatalog";
import {
  fetchEpisodesForSeries,
  fetchEpisodeDerivedSeriesSummaries,
  fetchSeriesPage,
  SERIES_PAGE_SIZE,
  type CatalogSeriesSummary,
} from "../lib/catalogPagination";
import type { QueryDocumentSnapshot } from "firebase/firestore";
import {
  bulkDeleteToastMessage,
  episodeDeleteToastMessage,
  seriesDeleteToastMessage,
} from "../lib/deleteMessages";
import { normalizeCloudinaryEpisodeUrls } from "../lib/cloudinary";
import { cloudinaryPublicIdFromUrl } from "../lib/episodeMeta";
import { writeAuditEvent } from "../lib/auditLog";
import { logError } from "../lib/logger";
import type { StudioAccess } from "../lib/studioAccess";
import { useConfirm } from "./ConfirmDialog";
import { useToast } from "./ToastStack";
import { UploadOverlay, type OverlayStep } from "./UploadOverlay";

type MediaLibraryProps = {
  userReady: boolean;
  canDelete: boolean;
  scopeProviderId?: string | null;
  studioAccess?: StudioAccess | null;
  actorUid?: string;
  actorEmail?: string | null;
};

type DeleteOverlayState = {
  title: string;
  subtitle: string;
  percent: number;
  indeterminate: boolean;
  steps: OverlayStep[];
};

export function MediaLibrary({
  userReady,
  canDelete,
  scopeProviderId = null,
  studioAccess = null,
  actorUid,
  actorEmail,
}: MediaLibraryProps) {
  async function logMediaDelete(
    targetId: string,
    seriesId: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    if (!actorUid || !studioAccess || studioAccess.role === "none") {
      return;
    }
    await writeAuditEvent({
      action: "media.delete",
      actorUid,
      actorEmail,
      role: studioAccess.role,
      providerId: studioAccess.providerId,
      targetType: "episode",
      targetId,
      seriesId,
      metadata,
    });
  }
  const toast = useToast();
  const { confirm } = useConfirm();
  const [seriesList, setSeriesList] = useState<CatalogSeriesSummary[]>([]);
  const [episodesBySeries, setEpisodesBySeries] = useState<
    Record<string, CatalogEpisode[]>
  >({});
  const [loadingEpisodes, setLoadingEpisodes] = useState<Set<string>>(
    () => new Set(),
  );
  const lastSeriesDocRef = useRef<QueryDocumentSnapshot | null>(null);
  const [hasMoreSeries, setHasMoreSeries] = useState(false);
  const [loadingMoreSeries, setLoadingMoreSeries] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteOverlay, setDeleteOverlay] = useState<DeleteOverlayState | null>(
    null,
  );
  const [filter, setFilter] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const busy = deleting || deleteOverlay !== null;

  const loadSeries = useCallback(
    async (append = false) => {
      if (!userReady) {
        setSeriesList([]);
        setEpisodesBySeries({});
        setLoading(false);
        return;
      }
      if (append) {
        setLoadingMoreSeries(true);
      } else {
        setLoading(true);
      }
      try {
        if (!append) {
          lastSeriesDocRef.current = null;
        }
        const page = await fetchSeriesPage({
          scopeProviderId,
          startAfterDoc: append ? lastSeriesDocRef.current : null,
        });
        let merged = page.series;
        if (!append && merged.length === 0) {
          const derived = await fetchEpisodeDerivedSeriesSummaries(
            scopeProviderId,
          );
          merged = derived.slice(0, SERIES_PAGE_SIZE);
        } else if (!append && merged.length > 0) {
          const known = new Set(merged.map((s) => s.seriesId));
          const derived = await fetchEpisodeDerivedSeriesSummaries(
            scopeProviderId,
            known,
          );
          if (derived.length > 0) {
            merged = [...merged, ...derived].sort((a, b) =>
              a.seriesTitle.localeCompare(b.seriesTitle),
            );
          }
        }
        setSeriesList((prev) =>
          append ? [...prev, ...merged] : merged,
        );
        lastSeriesDocRef.current = page.lastDoc;
        setHasMoreSeries(page.hasMore);
        if (!append) {
          setEpisodesBySeries({});
          setExpanded(
            Object.fromEntries(merged.map((s) => [s.seriesId, true])),
          );
          setSelectedIds(new Set());
        }
        setLastRefresh(new Date());
      } catch (error) {
        logError("Failed to load media library", error);
        toast.error("Library load failed", String(error));
      } finally {
        setLoading(false);
        setLoadingMoreSeries(false);
      }
    },
    [toast, userReady, scopeProviderId],
  );

  const load = useCallback(() => loadSeries(false), [loadSeries]);

  const ensureEpisodesLoaded = useCallback(
    async (summary: CatalogSeriesSummary): Promise<CatalogEpisode[]> => {
      const cached = episodesBySeries[summary.seriesId];
      if (cached) {
        return cached;
      }
      setLoadingEpisodes((prev) => new Set(prev).add(summary.seriesId));
      try {
        const episodes = await fetchEpisodesForSeries(
          summary.seriesId,
          summary.seriesTitle,
        );
        setEpisodesBySeries((prev) => ({
          ...prev,
          [summary.seriesId]: episodes,
        }));
        return episodes;
      } finally {
        setLoadingEpisodes((prev) => {
          const next = new Set(prev);
          next.delete(summary.seriesId);
          return next;
        });
      }
    },
    [episodesBySeries],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    for (const summary of seriesList) {
      if (expanded[summary.seriesId] && !episodesBySeries[summary.seriesId]) {
        void ensureEpisodesLoaded(summary);
      }
    }
  }, [seriesList, expanded, episodesBySeries, ensureEpisodesLoaded]);

  const filteredGroups = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const allGroups: CatalogSeriesGroup[] = seriesList.map((summary) => ({
      seriesId: summary.seriesId,
      seriesTitle: summary.seriesTitle,
      coverUrl: summary.coverUrl,
      category: summary.category,
      episodeCount: summary.episodeCount,
      episodes: episodesBySeries[summary.seriesId] ?? [],
    }));
    if (!q) {
      return allGroups;
    }
    return allGroups
      .map((group) => {
        const seriesMatch =
          group.seriesTitle.toLowerCase().includes(q) ||
          group.seriesId.toLowerCase().includes(q);
        const episodes = group.episodes.filter(
          (ep) =>
            seriesMatch ||
            ep.displayName.toLowerCase().includes(q) ||
            ep.id.toLowerCase().includes(q) ||
            (cloudinaryPublicIdFromUrl(ep.videoUrl) ?? "")
              .toLowerCase()
              .includes(q),
        );
        if (episodes.length === 0 && !seriesMatch) {
          return null;
        }
        return { ...group, episodes };
      })
      .filter((g): g is CatalogSeriesGroup => g !== null);
  }, [filter, seriesList, episodesBySeries]);

  const visibleEpisodes = useMemo(
    () => filteredGroups.flatMap((group) => group.episodes),
    [filteredGroups],
  );

  const episodeById = useMemo(() => {
    const map = new Map<string, CatalogEpisode>();
    for (const episodes of Object.values(episodesBySeries)) {
      for (const episode of episodes) {
        map.set(episode.id, episode);
      }
    }
    return map;
  }, [episodesBySeries]);

  const selectedCount = selectedIds.size;
  const allVisibleSelected =
    visibleEpisodes.length > 0 &&
    visibleEpisodes.every((ep) => selectedIds.has(ep.id));

  const totalEpisodes = useMemo(
    () => seriesList.reduce((n, s) => n + s.episodeCount, 0),
    [seriesList],
  );

  function showDeleteOverlay(state: DeleteOverlayState) {
    setDeleteOverlay(state);
  }

  function clearDeleteOverlay() {
    setDeleteOverlay(null);
  }

  function toggleEpisode(episodeId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(episodeId)) {
        next.delete(episodeId);
      } else {
        next.add(episodeId);
      }
      return next;
    });
  }

  function toggleSeriesEpisodes(group: CatalogSeriesGroup) {
    const ids = group.episodes.map((ep) => ep.id);
    const allSelected = ids.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        for (const id of ids) {
          next.delete(id);
        }
      } else {
        for (const id of ids) {
          next.add(id);
        }
      }
      return next;
    });
  }

  function toggleSelectAllVisible() {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(visibleEpisodes.map((ep) => ep.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function confirmDeleteEpisode(episode: CatalogEpisode) {
    const cloudId =
      cloudinaryPublicIdFromUrl(episode.videoUrl) ?? "(non-Cloudinary URL)";
    const ok = await confirm({
      title: "Delete episode?",
      message: `Remove "${episode.displayName}" from the app and Cloudinary.`,
      details: [
        `Firestore: ${episode.id}`,
        `Series: ${episode.seriesTitle} (${episode.seriesId})`,
        `Cloudinary: ${cloudId}`,
      ],
      confirmLabel: "Delete episode",
      variant: "danger",
    });
    if (!ok) {
      return;
    }

    setDeleting(true);
    showDeleteOverlay({
      title: "Deleting episode",
      subtitle: episode.displayName,
      percent: 0,
      indeterminate: true,
      steps: [
        { label: "Remove from Cloudinary", done: false, active: true },
        { label: "Remove from Firestore", done: false, active: false },
        { label: "Update series", done: false, active: false },
      ],
    });

    try {
      const result = await deleteEpisodeFromCatalog(episode);
      await logMediaDelete(episode.id, episode.seriesId, {
        displayName: episode.displayName,
        bulk: false,
      });
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(episode.id);
        return next;
      });
      await load();
      toast.success("Episode deleted", episodeDeleteToastMessage(result));
    } catch (error) {
      logError("Delete episode failed", error);
      toast.error(
        "Delete failed",
        `Could not delete ${episode.displayName} (${episode.id}): ${String(error)}`,
      );
    } finally {
      setDeleting(false);
      clearDeleteOverlay();
    }
  }

  async function confirmDeleteSelected() {
    const episodes = [...selectedIds]
      .map((id) => episodeById.get(id))
      .filter((ep): ep is CatalogEpisode => ep !== undefined);

    if (episodes.length === 0) {
      return;
    }

    const previewNames = episodes
      .slice(0, 4)
      .map((ep) => ep.displayName)
      .join(", ");
    const ok = await confirm({
      title: `Delete ${episodes.length} episodes?`,
      message: "Remove all selected episodes from Firestore and Cloudinary.",
      details: [
        previewNames +
          (episodes.length > 4 ? ` +${episodes.length - 4} more` : ""),
      ],
      confirmLabel: `Delete ${episodes.length} episodes`,
      variant: "danger",
    });
    if (!ok) {
      return;
    }

    setDeleting(true);
    showDeleteOverlay({
      title: "Deleting episodes",
      subtitle: `0 of ${episodes.length}`,
      percent: 0,
      indeterminate: false,
      steps: [
        { label: "Cloudinary assets", done: false, active: true },
        { label: "Firestore documents", done: false, active: false },
        { label: "Series sync", done: false, active: false },
      ],
    });

    try {
      const result = await deleteEpisodesFromCatalog(
        episodes,
        (current, total, episode) => {
          const percent = Math.round((current / total) * 100);
          showDeleteOverlay({
            title: "Deleting episodes",
            subtitle: `${current} of ${total} — ${episode.displayName}`,
            percent,
            indeterminate: false,
            steps: [
              {
                label: "Cloudinary assets",
                done: current > 1,
                active: current <= total,
              },
              {
                label: "Firestore documents",
                done: current === total,
                active: current === total,
              },
              {
                label: "Series sync",
                done: false,
                active: false,
              },
            ],
          });
        },
      );

      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const ep of episodes) {
          if (!result.failed.some((f) => f.id === ep.id)) {
            next.delete(ep.id);
          }
        }
        return next;
      });

      showDeleteOverlay({
        title: "Refreshing library",
        subtitle: "Updating list…",
        percent: 100,
        indeterminate: true,
        steps: [
          { label: "Cloudinary assets", done: true, active: false },
          { label: "Firestore documents", done: true, active: false },
          { label: "Series sync", done: true, active: false },
        ],
      });

      await load();

      if (result.deleted > 0 && actorUid && studioAccess) {
        await writeAuditEvent({
          action: "media.delete",
          actorUid,
          actorEmail,
          role: studioAccess.role,
          providerId: studioAccess.providerId,
          targetType: "episode",
          targetId: "bulk",
          metadata: {
            bulk: true,
            count: result.deleted,
            episodeIds: result.deletedEpisodes.map((d) => d.id),
            seriesIds: [
              ...new Set(
                episodes
                  .filter((ep) =>
                    result.deletedEpisodes.some((d) => d.id === ep.id),
                  )
                  .map((ep) => ep.seriesId),
              ),
            ],
          },
        });
      }

      const toastPayload = bulkDeleteToastMessage(result);
      if (toastPayload.kind === "success") {
        toast.success(toastPayload.title, toastPayload.message);
      } else {
        toast.error(toastPayload.title, toastPayload.message);
      }
    } catch (error) {
      logError("Bulk delete failed", error);
      toast.error(
        "Delete failed",
        `Bulk delete stopped: ${String(error)}`,
      );
    } finally {
      setDeleting(false);
      clearDeleteOverlay();
    }
  }

  async function confirmDeleteSeries(group: CatalogSeriesGroup) {
    const episodes =
      group.episodes.length > 0
        ? group.episodes
        : await ensureEpisodesLoaded({
            seriesId: group.seriesId,
            seriesTitle: group.seriesTitle,
            coverUrl: group.coverUrl,
            category: group.category,
            episodeCount: group.episodeCount,
            providerId: null,
          });
    const groupWithEpisodes = { ...group, episodes };

    const ok = await confirm({
      title: "Delete entire series?",
      message: `Remove "${group.seriesTitle}" and all its episodes from the app and Cloudinary.`,
      details: [
        `Series ID: ${group.seriesId}`,
        `${groupWithEpisodes.episodes.length} episode(s) will be deleted`,
        "Removed from For You if featured",
      ],
      confirmLabel: "Delete series",
      variant: "danger",
    });
    if (!ok) {
      return;
    }

    setDeleting(true);
    showDeleteOverlay({
      title: "Deleting series",
      subtitle: `${group.seriesTitle} · ${groupWithEpisodes.episodes.length} episode(s)`,
      percent: 0,
      indeterminate: true,
      steps: [
        {
          label: `Episodes (${groupWithEpisodes.episodes.length})`,
          done: false,
          active: true,
        },
        { label: "Series document", done: false, active: false },
        { label: "For You list", done: false, active: false },
      ],
    });

    try {
      const result = await deleteSeriesFromCatalog(
        groupWithEpisodes.seriesId,
        groupWithEpisodes.episodes,
        groupWithEpisodes.seriesTitle,
      );
      if (actorUid && studioAccess && studioAccess.role !== "none") {
        await writeAuditEvent({
          action: "media.delete",
          actorUid,
          actorEmail,
          role: studioAccess.role,
          providerId: studioAccess.providerId,
          targetType: "series",
          targetId: group.seriesId,
          seriesId: group.seriesId,
          metadata: { episodeCount: result.episodeCount },
        });
      }
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const ep of group.episodes) {
          next.delete(ep.id);
        }
        return next;
      });
      await load();
      toast.success("Series deleted", seriesDeleteToastMessage(result));
    } catch (error) {
      logError("Delete series failed", error);
      toast.error(
        "Delete failed",
        `Could not delete "${group.seriesTitle}" (${group.seriesId}): ${String(error)}`,
      );
    } finally {
      setDeleting(false);
      clearDeleteOverlay();
    }
  }

  if (!userReady) {
    return (
      <section className="card">
        <p className="hint">Sign in to browse and manage published media.</p>
      </section>
    );
  }

  return (
    <div className="library">
      <UploadOverlay
        open={deleteOverlay !== null}
        title={deleteOverlay?.title ?? "Deleting…"}
        subtitle={deleteOverlay?.subtitle ?? ""}
        percent={deleteOverlay?.percent ?? 0}
        indeterminate={deleteOverlay?.indeterminate ?? true}
        steps={deleteOverlay?.steps ?? []}
        hint="Do not close this tab while deletion is in progress."
      />

      <section className="card">
        <div className="library__header">
          <div>
            <h2 className="section-title">Media library</h2>
            <p className="hint">
              Series load in pages of {SERIES_PAGE_SIZE}. Episodes load when you
              expand a series (expanded by default). Search filters loaded
              series only.
              {lastRefresh ? ` Last refresh ${lastRefresh.toLocaleTimeString()}.` : ""}
            </p>
          </div>
          <button
            type="button"
            className="btn btn--ghost"
            disabled={loading || busy}
            onClick={() => void load()}
          >
            Refresh
          </button>
        </div>

        {!canDelete && (
          <p className="library__warn">
            {studioAccess?.role === "provider"
              ? "Provider accounts can browse their catalog but cannot delete. Contact a super-admin to remove content."
              : "You can browse, but deleting requires a super-admin account."}
          </p>
        )}

        {canDelete && visibleEpisodes.length > 0 && (
          <div className="library-bulk">
            <label className="check library-bulk__select">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                disabled={busy}
                onChange={toggleSelectAllVisible}
              />
              Select all shown ({visibleEpisodes.length})
            </label>
            <div className="library-bulk__actions">
              {selectedCount > 0 && (
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  disabled={busy}
                  onClick={clearSelection}
                >
                  Clear ({selectedCount})
                </button>
              )}
              <button
                type="button"
                className="btn btn--danger btn--sm"
                disabled={busy || selectedCount === 0}
                onClick={() => void confirmDeleteSelected()}
              >
                {busy ? "Deleting…" : `Delete selected (${selectedCount})`}
              </button>
            </div>
          </div>
        )}

        <div className="field">
          <span className="field__label">Search</span>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Series title, episode id, Cloudinary id…"
            disabled={busy}
          />
        </div>

        <p className="hint">
          {loading
            ? "Loading…"
            : `${filteredGroups.length} series shown · ${totalEpisodes} episode(s) in loaded pages`}
        </p>
      </section>

      {loading ? (
        <section className="card">
          <p className="hint">Loading catalog…</p>
        </section>
      ) : filteredGroups.length === 0 ? (
        <section className="card">
          <p className="hint">
            No series in this page yet. If you published before, click Refresh
            or check Firestore rules/indexes (browser console may show{" "}
            <code>permission-denied</code> or <code>failed-precondition</code>
            ).
          </p>
        </section>
      ) : (
        filteredGroups.map((group) => {
          const seriesEpisodeIds = group.episodes.map((ep) => ep.id);
          const seriesAllSelected =
            seriesEpisodeIds.length > 0 &&
            seriesEpisodeIds.every((id) => selectedIds.has(id));
          const seriesSomeSelected =
            !seriesAllSelected &&
            seriesEpisodeIds.some((id) => selectedIds.has(id));

          return (
            <section key={group.seriesId} className="card library-series">
              <div className="library-series__head">
                {canDelete && (
                  <label
                    className="library-series__check check"
                    title="Select all episodes in this series"
                  >
                    <input
                      type="checkbox"
                      checked={seriesAllSelected}
                      ref={(el) => {
                        if (el) {
                          el.indeterminate = seriesSomeSelected;
                        }
                      }}
                      disabled={busy}
                      onChange={() => toggleSeriesEpisodes(group)}
                    />
                  </label>
                )}
                <button
                  type="button"
                  className="library-series__toggle"
                  onClick={() => {
                    const willExpand = !expanded[group.seriesId];
                    setExpanded((prev) => ({
                      ...prev,
                      [group.seriesId]: willExpand,
                    }));
                    if (willExpand) {
                      const summary = seriesList.find(
                        (s) => s.seriesId === group.seriesId,
                      );
                      if (summary) {
                        void ensureEpisodesLoaded(summary);
                      }
                    }
                  }}
                >
                  <span className="library-series__chevron">
                    {expanded[group.seriesId] ? "▼" : "▶"}
                  </span>
                  <div className="library-series__meta">
                    <h3>{group.seriesTitle}</h3>
                    <p className="hint">
                      <code>{group.seriesId}</code> · {group.category} ·{" "}
                      {group.episodeCount} episode(s)
                    </p>
                  </div>
                </button>
                {canDelete && (
                  <button
                    type="button"
                    className="btn btn--danger btn--sm"
                    disabled={busy}
                    onClick={() => void confirmDeleteSeries(group)}
                  >
                    {busy ? "Deleting…" : "Delete series"}
                  </button>
                )}
              </div>

              {expanded[group.seriesId] && (
                <div className="library-grid">
                  {loadingEpisodes.has(group.seriesId) &&
                  group.episodes.length === 0 ? (
                    <p className="hint">Loading episodes…</p>
                  ) : null}
                  {group.episodes.map((episode) => {
                    const media = normalizeCloudinaryEpisodeUrls(
                      episode.videoUrl,
                      episode.thumbnailUrl,
                    );
                    const isSelected = selectedIds.has(episode.id);

                    return (
                      <article
                        key={episode.id}
                        className={`library-card ${isSelected ? "library-card--selected" : ""}`}
                      >
                        {canDelete && (
                          <label className="library-card__check">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={busy}
                              onChange={() => toggleEpisode(episode.id)}
                            />
                          </label>
                        )}
                        <div className="library-card__thumb">
                          {media.thumbnailUrl ? (
                            <img
                              src={media.thumbnailUrl}
                              alt=""
                              loading="lazy"
                            />
                          ) : (
                            <span className="library-card__placeholder">
                              No image
                            </span>
                          )}
                        </div>
                        <div className="library-card__body">
                          <p className="library-card__title">
                            {episode.displayName}
                          </p>
                          <p className="library-card__sub">
                            <code>{episode.id}</code>
                          </p>
                          <p className="library-card__sub">
                            {episode.durationSec}s
                            {episode.isVipLocked
                              ? " · VIP"
                              : episode.bonusUnlockCost
                                ? ` · ${episode.bonusUnlockCost} bonus`
                                : ""}
                          </p>
                          {cloudinaryPublicIdFromUrl(episode.videoUrl) && (
                            <p className="library-card__cloud">
                              {cloudinaryPublicIdFromUrl(episode.videoUrl)}
                            </p>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              className="btn btn--danger btn--sm library-card__delete"
                              disabled={busy}
                              onClick={() => void confirmDeleteEpisode(episode)}
                            >
                              {busy ? "Deleting…" : "Delete"}
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })
      )}

      {!loading && hasMoreSeries ? (
        <section className="card">
          <button
            type="button"
            className="btn btn--ghost"
            disabled={loadingMoreSeries || busy}
            onClick={() => void loadSeries(true)}
          >
            {loadingMoreSeries ? "Loading…" : "Load more series"}
          </button>
        </section>
      ) : null}
    </div>
  );
}
