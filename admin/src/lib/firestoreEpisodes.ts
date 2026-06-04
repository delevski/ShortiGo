import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";

export type PublishedEpisodeRow = {
  id: string;
  order: number;
  durationSec: number;
  videoUrl: string;
  thumbnailUrl: string;
};

export async function fetchPublishedEpisodes(
  seriesId: string,
): Promise<PublishedEpisodeRow[]> {
  if (!db || !seriesId.trim()) {
    return [];
  }
  const snap = await getDocs(
    query(
      collection(db, "episodes"),
      where("seriesId", "==", seriesId.trim()),
    ),
  );
  const rows: PublishedEpisodeRow[] = snap.docs.map((item) => {
    const data = item.data();
    return {
      id: item.id,
      order: typeof data.order === "number" ? data.order : 0,
      durationSec: typeof data.durationSec === "number" ? data.durationSec : 0,
      videoUrl: typeof data.videoUrl === "string" ? data.videoUrl : "",
      thumbnailUrl:
        typeof data.thumbnailUrl === "string" ? data.thumbnailUrl : "",
    };
  });
  rows.sort((a, b) => a.order - b.order);
  return rows;
}

/** Find published episodes whose video URL contains a Cloudinary public id fragment. */
export async function findEpisodesByCloudinaryId(
  publicIdFragment: string,
  scopeProviderId?: string | null,
): Promise<(PublishedEpisodeRow & { seriesId: string })[]> {
  if (!db || !publicIdFragment.trim()) {
    return [];
  }
  const needle = publicIdFragment.trim();
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
    const data = item.data();
    const videoUrl = typeof data.videoUrl === "string" ? data.videoUrl : "";
    if (!videoUrl.includes(needle)) {
      continue;
    }
    matches.push({
      id: item.id,
      seriesId: typeof data.seriesId === "string" ? data.seriesId : "",
      order: typeof data.order === "number" ? data.order : 0,
      durationSec: typeof data.durationSec === "number" ? data.durationSec : 0,
      videoUrl,
      thumbnailUrl:
        typeof data.thumbnailUrl === "string" ? data.thumbnailUrl : "",
    });
  }
  matches.sort((a, b) => a.seriesId.localeCompare(b.seriesId) || a.order - b.order);
  return matches;
}
