import { useCallback, useEffect, useMemo, useState } from "react";
import {
  deleteEpisodeFromCatalog,
  deleteEpisodesFromCatalog,
  deleteSeriesFromCatalog,
  fetchCatalog,
  type CatalogEpisode,
  type CatalogSeriesGroup,
} from "../lib/firestoreCatalog";
import {
  bulkDeleteToastMessage,
  episodeDeleteToastMessage,
  seriesDeleteToastMessage,
} from "../lib/deleteMessages";
import { normalizeCloudinaryEpisodeUrls } from "../lib/cloudinary";
import { cloudinaryPublicIdFromUrl } from "../lib/episodeMeta";
import { logError } from "../lib/logger";
import { useConfirm } from "./ConfirmDialog";
import { useToast } from "./ToastStack";
import { UploadOverlay, type OverlayStep } from "./UploadOverlay";

type MediaLibraryProps = {
  userReady: boolean;
  canDelete: boolean;
};

type DeleteOverlayState = {
  title: string;
  subtitle: string;
  percent: number;
  indeterminate: boolean;
  steps: OverlayStep[];
};

export function MediaLibrary({ userReady, canDelete }: MediaLibraryProps) {
  const toast = useToast();
  const { confirm } = useConfirm();
  const [groups, setGroups] = useState<CatalogSeriesGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteOverlay, setDeleteOverlay] = useState<DeleteOverlayState | null>(
    null,
  );
  const [filter, setFilter] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const busy = deleting || deleteOverlay !== null;

  const load = useCallback(async () => {
    if (!userReady) {
      setGroups([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const catalog = await fetchCatalog();
      setGroups(catalog);
      setExpanded((prev) => {
        const next = { ...prev };
        for (const g of catalog) {
          if (next[g.seriesId] === undefined) {
            next[g.seriesId] = true;
          }
        }
        return next;
      });
      setSelectedIds((prev) => {
        const valid = new Set(catalog.flatMap((g) => g.episodes.map((e) => e.id)));
        return new Set([...prev].filter((id) => valid.has(id)));
      });
    } catch (error) {
      logError("Failed to load media library", error);
      toast.error("Library load failed", String(error));
    } finally {
      setLoading(false);
    }
  }, [toast, userReady]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredGroups = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) {
      return groups;
    }
    return groups
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
  }, [filter, groups]);

  const visibleEpisodes = useMemo(
    () => filteredGroups.flatMap((group) => group.episodes),
    [filteredGroups],
  );

  const episodeById = useMemo(() => {
    const map = new Map<string, CatalogEpisode>();
    for (const group of groups) {
      for (const episode of group.episodes) {
        map.set(episode.id, episode);
      }
    }
    return map;
  }, [groups]);

  const selectedCount = selectedIds.size;
  const allVisibleSelected =
    visibleEpisodes.length > 0 &&
    visibleEpisodes.every((ep) => selectedIds.has(ep.id));

  const totalEpisodes = useMemo(
    () => groups.reduce((n, g) => n + g.episodes.length, 0),
    [groups],
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
    const ok = await confirm({
      title: "Delete entire series?",
      message: `Remove "${group.seriesTitle}" and all its episodes from the app and Cloudinary.`,
      details: [
        `Series ID: ${group.seriesId}`,
        `${group.episodes.length} episode(s) will be deleted`,
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
      subtitle: `${group.seriesTitle} · ${group.episodes.length} episode(s)`,
      percent: 0,
      indeterminate: true,
      steps: [
        {
          label: `Episodes (${group.episodes.length})`,
          done: false,
          active: true,
        },
        { label: "Series document", done: false, active: false },
        { label: "For You list", done: false, active: false },
      ],
    });

    try {
      const result = await deleteSeriesFromCatalog(
        group.seriesId,
        group.episodes,
        group.seriesTitle,
      );
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
              Select multiple episodes to delete from Firestore and Cloudinary
              together.
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
            You can browse, but deleting requires{" "}
            <code>adminUsers/{"{uid}"}</code> in Firestore.
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
            : `${filteredGroups.length} series · ${totalEpisodes} episode(s) total`}
        </p>
      </section>

      {loading ? (
        <section className="card">
          <p className="hint">Loading catalog…</p>
        </section>
      ) : filteredGroups.length === 0 ? (
        <section className="card">
          <p className="hint">No published episodes match your search.</p>
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
                  onClick={() =>
                    setExpanded((prev) => ({
                      ...prev,
                      [group.seriesId]: !prev[group.seriesId],
                    }))
                  }
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
                            {episode.isVipLocked ? " · VIP" : ""}
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
    </div>
  );
}
