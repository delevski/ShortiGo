import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import {
  getCachedSeriesEpisodes,
  setCachedSeriesEpisodes,
} from "./episodeSeriesCache";
import { cloudinaryPublicIdFromUrl } from "./episodeMeta";

export type PublishedEpisodeRow = {
  id: string;
  order: number;
  durationSec: number;
  videoUrl: string;
  thumbnailUrl: string;
};

function mapEpisodeDoc(
  item: { id: string; data: () => Record<string, unknown> },
): PublishedEpisodeRow {
  const data = item.data();
  return {
    id: item.id,
    order: typeof data.order === "number" ? data.order : 0,
    durationSec: typeof data.durationSec === "number" ? data.durationSec : 0,
    videoUrl: typeof data.videoUrl === "string" ? data.videoUrl : "",
    thumbnailUrl:
      typeof data.thumbnailUrl === "string" ? data.thumbnailUrl : "",
  };
}

export async function fetchPublishedEpisodes(
  seriesId: string,
  options?: { skipCache?: boolean },
): Promise<PublishedEpisodeRow[]> {
  if (!db || !seriesId.trim()) {
    return [];
  }
  const key = seriesId.trim();
  if (!options?.skipCache) {
    const cached = getCachedSeriesEpisodes(key);
    if (cached) {
      return cached;
    }
  }
  const snap = await getDocs(
    query(collection(db, "episodes"), where("seriesId", "==", key)),
  );
  const rows = snap.docs.map((item) => mapEpisodeDoc(item));
  rows.sort((a, b) => a.order - b.order);
  setCachedSeriesEpisodes(key, rows);
  return rows;
}

function mapMatchDoc(
  item: { id: string; data: () => Record<string, unknown> },
): PublishedEpisodeRow & { seriesId: string } {
  const data = item.data();
  const base = mapEpisodeDoc(item);
  return {
    ...base,
    seriesId: typeof data.seriesId === "string" ? data.seriesId : "",
  };
}

/** Find episodes by indexed cloudinaryVideoPublicId, with legacy URL fallback. */
export async function findEpisodesByCloudinaryId(
  videoUrl: string,
  scopeProviderId?: string | null,
  excludeEpisodeId?: string | null,
): Promise<(PublishedEpisodeRow & { seriesId: string })[]> {
  if (!db || !videoUrl.trim()) {
    return [];
  }
  const publicId = cloudinaryPublicIdFromUrl(videoUrl.trim());
  if (!publicId) {
    return [];
  }

  const indexedMatches = await queryByCloudinaryPublicId(
    publicId,
    scopeProviderId,
  );
  let matches = indexedMatches.filter(
    (row) => !excludeEpisodeId || row.id !== excludeEpisodeId,
  );

  if (matches.length === 0) {
    matches = await legacyUrlScanMatches(
      publicId,
      scopeProviderId,
      excludeEpisodeId,
    );
  }

  matches.sort(
    (a, b) => a.seriesId.localeCompare(b.seriesId) || a.order - b.order,
  );
  return matches;
}

async function queryByCloudinaryPublicId(
  publicId: string,
  scopeProviderId?: string | null,
): Promise<(PublishedEpisodeRow & { seriesId: string })[]> {
  if (!db) {
    return [];
  }
  const constraints = scopeProviderId
    ? [
        where("providerId", "==", scopeProviderId),
        where("cloudinaryVideoPublicId", "==", publicId),
      ]
    : [where("cloudinaryVideoPublicId", "==", publicId)];

  const snap = await getDocs(query(collection(db, "episodes"), ...constraints));
  return snap.docs.map((item) => mapMatchDoc(item));
}

async function legacyUrlScanMatches(
  publicId: string,
  scopeProviderId?: string | null,
  excludeEpisodeId?: string | null,
): Promise<(PublishedEpisodeRow & { seriesId: string })[]> {
  if (!db) {
    return [];
  }
  const needle = publicId.split("/").pop() ?? publicId;
  if (needle.length < 4) {
    return [];
  }
  const snap = scopeProviderId
    ? await getDocs(
        query(
          collection(db, "episodes"),
          where("providerId", "==", scopeProviderId),
        ),
      )
    : await getDocs(collection(db, "episodes"));
  const matches: (PublishedEpisodeRow & { seriesId: string })[] = [];
  for (const item of snap.docs) {
    if (excludeEpisodeId && item.id === excludeEpisodeId) {
      continue;
    }
    const data = item.data();
    const storedId =
      typeof data.cloudinaryVideoPublicId === "string"
        ? data.cloudinaryVideoPublicId
        : "";
    if (storedId === publicId) {
      matches.push(mapMatchDoc(item));
      continue;
    }
    const videoUrl = typeof data.videoUrl === "string" ? data.videoUrl : "";
    if (videoUrl.includes(publicId) || videoUrl.includes(needle)) {
      matches.push(mapMatchDoc(item));
    }
  }
  return matches;
}
