import {
  arrayRemove,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  cloudinaryAssetsFromUrls,
  deleteCloudinaryAssets,
} from "./cloudinaryDelete";
import { episodeAppLabel } from "./episodeMeta";
import { logInfo } from "./logger";
import { invalidateSeriesEpisodeCache } from "./episodeSeriesCache";
import { applyEpisodeDeleteStats } from "./seriesStats";
import { getSeriesMeta, syncSeriesStats } from "./seriesFirestore";

export { syncSeriesStats } from "./seriesFirestore";

export type CatalogEpisode = {
  id: string;
  seriesId: string;
  seriesTitle: string;
  order: number;
  durationSec: number;
  videoUrl: string;
  thumbnailUrl: string;
  displayName: string;
  isVipLocked: boolean;
  bonusUnlockCost: number | null;
};

export type CatalogSeriesGroup = {
  seriesId: string;
  seriesTitle: string;
  coverUrl: string;
  category: string;
  episodeCount: number;
  episodes: CatalogEpisode[];
};

export async function fetchCatalog(
  scopeProviderId?: string | null,
): Promise<CatalogSeriesGroup[]> {
  if (!db) {
    return [];
  }

  const [seriesSnap, episodesSnap] = await Promise.all([
    scopeProviderId
      ? getDocs(
          query(
            collection(db, "series"),
            where("providerId", "==", scopeProviderId),
          ),
        )
      : getDocs(collection(db, "series")),
    scopeProviderId
      ? getDocs(
          query(
            collection(db, "episodes"),
            where("providerId", "==", scopeProviderId),
          ),
        )
      : getDocs(collection(db, "episodes")),
  ]);

  const seriesById = new Map<
    string,
    { title: string; coverUrl: string; category: string }
  >();
  for (const item of seriesSnap.docs) {
    const data = item.data();
    seriesById.set(item.id, {
      title: typeof data.title === "string" ? data.title : item.id,
      coverUrl: typeof data.coverUrl === "string" ? data.coverUrl : "",
      category: typeof data.category === "string" ? data.category : "new",
    });
  }

  const groups = new Map<string, CatalogSeriesGroup>();

  for (const item of episodesSnap.docs) {
    const data = item.data();
    const seriesId = typeof data.seriesId === "string" ? data.seriesId : "";
    if (!seriesId) {
      continue;
    }
    const order = typeof data.order === "number" ? data.order : 0;
    const seriesInfo = seriesById.get(seriesId);
    const seriesTitle = seriesInfo?.title ?? seriesId;

    if (!groups.has(seriesId)) {
      groups.set(seriesId, {
        seriesId,
        seriesTitle,
        coverUrl: seriesInfo?.coverUrl ?? "",
        category: seriesInfo?.category ?? "new",
        episodeCount: 0,
        episodes: [],
      });
    }

    const group = groups.get(seriesId)!;
    group.episodes.push({
      id: item.id,
      seriesId,
      seriesTitle,
      order,
      durationSec:
        typeof data.durationSec === "number" ? data.durationSec : 0,
      videoUrl: typeof data.videoUrl === "string" ? data.videoUrl : "",
      thumbnailUrl:
        typeof data.thumbnailUrl === "string" ? data.thumbnailUrl : "",
      displayName: `${seriesTitle} · ${episodeAppLabel(order)}`,
      isVipLocked: data.isVipLocked === true,
      bonusUnlockCost:
        typeof data.bonusUnlockCost === "number" ? data.bonusUnlockCost : null,
    });
  }

  for (const group of groups.values()) {
    group.episodes.sort((a, b) => a.order - b.order);
    group.episodeCount = group.episodes.length;
    if (!group.coverUrl && group.episodes[0]?.thumbnailUrl) {
      group.coverUrl = group.episodes[0].thumbnailUrl;
    }
  }

  const sorted = [...groups.values()].sort((a, b) =>
    a.seriesTitle.localeCompare(b.seriesTitle),
  );
  return sorted;
}

async function removeSeriesFromFeatured(seriesId: string): Promise<void> {
  if (!db) {
    return;
  }
  await setDoc(
    doc(db, "admin", "featured"),
    { seriesIds: arrayRemove(seriesId) },
    { merge: true },
  );
}

export type DeleteEpisodeResult = {
  episodeId: string;
  displayName: string;
  seriesId: string;
  seriesTitle: string;
  remainingEpisodeCount: number;
  seriesRemoved: boolean;
};

export type DeleteSeriesResult = {
  seriesId: string;
  seriesTitle: string;
  episodeCount: number;
};

export type BulkDeleteResult = {
  deleted: number;
  failed: { id: string; displayName: string; error: string }[];
  removedSeries: { seriesId: string; seriesTitle: string }[];
  deletedEpisodes: { id: string; displayName: string; seriesTitle: string }[];
};

export async function deleteEpisodeFromCatalog(
  episode: CatalogEpisode,
): Promise<DeleteEpisodeResult> {
  if (!db) {
    throw new Error("Firestore is not ready.");
  }

  const assets = cloudinaryAssetsFromUrls(
    episode.videoUrl,
    episode.thumbnailUrl,
  );
  await deleteCloudinaryAssets(assets);

  await deleteDoc(doc(db, "episodes", episode.id));
  logInfo("Deleted episode from Firestore", { episodeId: episode.id });
  invalidateSeriesEpisodeCache(episode.seriesId);

  const meta = await getSeriesMeta(episode.seriesId);
  const stats = await applyEpisodeDeleteStats(episode.seriesId, meta, {
    count: 1,
    totalDurationSec: episode.durationSec,
  });
  let seriesRemoved = false;
  if (stats.episodeCount === 0) {
    await deleteDoc(doc(db, "series", episode.seriesId));
    await removeSeriesFromFeatured(episode.seriesId);
    seriesRemoved = true;
    logInfo("Removed empty series", { seriesId: episode.seriesId });
  }

  return {
    episodeId: episode.id,
    displayName: episode.displayName,
    seriesId: episode.seriesId,
    seriesTitle: meta.title,
    remainingEpisodeCount: stats.episodeCount,
    seriesRemoved,
  };
}

export async function deleteEpisodesFromCatalog(
  episodes: CatalogEpisode[],
  onProgress?: (current: number, total: number, episode: CatalogEpisode) => void,
): Promise<BulkDeleteResult> {
  if (!db) {
    throw new Error("Firestore is not ready.");
  }
  if (episodes.length === 0) {
    return {
      deleted: 0,
      failed: [],
      removedSeries: [],
      deletedEpisodes: [],
    };
  }

  const failed: BulkDeleteResult["failed"] = [];
  const removedBySeries = new Map<
    string,
    { count: number; totalDurationSec: number; seriesTitle: string }
  >();
  const deletedEpisodes: BulkDeleteResult["deletedEpisodes"] = [];
  const total = episodes.length;

  for (let index = 0; index < episodes.length; index += 1) {
    const episode = episodes[index];
    onProgress?.(index + 1, total, episode);
    try {
      const assets = cloudinaryAssetsFromUrls(
        episode.videoUrl,
        episode.thumbnailUrl,
      );
      await deleteCloudinaryAssets(assets);
      await deleteDoc(doc(db, "episodes", episode.id));
      invalidateSeriesEpisodeCache(episode.seriesId);
      const bucket = removedBySeries.get(episode.seriesId) ?? {
        count: 0,
        totalDurationSec: 0,
        seriesTitle: episode.seriesTitle,
      };
      bucket.count += 1;
      bucket.totalDurationSec += episode.durationSec;
      removedBySeries.set(episode.seriesId, bucket);
      deletedEpisodes.push({
        id: episode.id,
        displayName: episode.displayName,
        seriesTitle: episode.seriesTitle,
      });
      logInfo("Deleted episode from Firestore (bulk)", { episodeId: episode.id });
    } catch (error) {
      failed.push({
        id: episode.id,
        displayName: episode.displayName,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const removedSeries: BulkDeleteResult["removedSeries"] = [];
  for (const [seriesId, removed] of removedBySeries) {
    try {
      const meta = await getSeriesMeta(seriesId);
      const stats = await applyEpisodeDeleteStats(seriesId, meta, {
        count: removed.count,
        totalDurationSec: removed.totalDurationSec,
      });
      if (stats.episodeCount === 0) {
        await deleteDoc(doc(db, "series", seriesId));
        await removeSeriesFromFeatured(seriesId);
        removedSeries.push({ seriesId, seriesTitle: meta.title });
        logInfo("Removed empty series after bulk delete", { seriesId });
      }
    } catch (error) {
      logInfo("Series sync after bulk delete failed", {
        seriesId,
        error: String(error),
      });
    }
  }

  return {
    deleted: deletedEpisodes.length,
    failed,
    removedSeries,
    deletedEpisodes,
  };
}

export async function deleteSeriesFromCatalog(
  seriesId: string,
  episodes: CatalogEpisode[],
  seriesTitle?: string,
): Promise<DeleteSeriesResult> {
  if (!db) {
    throw new Error("Firestore is not ready.");
  }

  for (const episode of episodes) {
    const assets = cloudinaryAssetsFromUrls(
      episode.videoUrl,
      episode.thumbnailUrl,
    );
    await deleteCloudinaryAssets(assets);
    await deleteDoc(doc(db, "episodes", episode.id));
  }
  invalidateSeriesEpisodeCache(seriesId);

  await deleteDoc(doc(db, "series", seriesId));
  await removeSeriesFromFeatured(seriesId);
  logInfo("Deleted series and episodes", {
    seriesId,
    episodeCount: episodes.length,
  });

  const title =
    seriesTitle?.trim() ||
    episodes[0]?.seriesTitle ||
    seriesId;

  return {
    seriesId,
    seriesTitle: title,
    episodeCount: episodes.length,
  };
}
