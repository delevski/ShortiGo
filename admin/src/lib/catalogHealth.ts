import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { cloudinaryPublicIdFromUrl } from "./episodeMeta";
import { getSeriesMeta, syncSeriesStats } from "./seriesFirestore";

export type HealthIssue = {
  id: string;
  severity: "error" | "warn";
  category: string;
  message: string;
  targetId?: string;
  seriesId?: string;
};

export type HealthScanResult = {
  issues: HealthIssue[];
  scannedSeries: number;
  scannedEpisodes: number;
};

export async function scanCatalogHealth(
  scopeProviderId?: string | null,
): Promise<HealthScanResult> {
  if (!db) {
    return { issues: [], scannedSeries: 0, scannedEpisodes: 0 };
  }

  const issues: HealthIssue[] = [];
  const seriesSnap = scopeProviderId
    ? await getDocs(
        query(
          collection(db, "series"),
          where("providerId", "==", scopeProviderId),
        ),
      )
    : await getDocs(collection(db, "series"));

  const episodesSnap = scopeProviderId
    ? await getDocs(
        query(
          collection(db, "episodes"),
          where("providerId", "==", scopeProviderId),
        ),
      )
    : await getDocs(collection(db, "episodes"));

  const episodesBySeries = new Map<string, typeof episodesSnap.docs>();
  for (const ep of episodesSnap.docs) {
    const seriesId =
      typeof ep.data().seriesId === "string" ? ep.data().seriesId : "";
    if (!seriesId) {
      continue;
    }
    const list = episodesBySeries.get(seriesId) ?? [];
    list.push(ep);
    episodesBySeries.set(seriesId, list);
  }

  const featuredSnap = await getDoc(doc(db, "admin", "featured"));
  const featuredIds = new Set<string>(
    featuredSnap.exists() && Array.isArray(featuredSnap.data()?.seriesIds)
      ? (featuredSnap.data()?.seriesIds as string[])
      : [],
  );

  for (const seriesDoc of seriesSnap.docs) {
    const data = seriesDoc.data();
    const seriesId = seriesDoc.id;
    const storedCount =
      typeof data.episodeCount === "number" ? data.episodeCount : 0;
    const eps = episodesBySeries.get(seriesId) ?? [];
    const actualCount = eps.length;

    if (storedCount !== actualCount) {
      issues.push({
        id: `count-${seriesId}`,
        severity: "warn",
        category: "series_stats",
        message: `Series "${seriesId}" reports ${storedCount} episodes but Firestore has ${actualCount}.`,
        seriesId,
        targetId: seriesId,
      });
    }

    if (data.isPublished === false && featuredIds.has(seriesId)) {
      issues.push({
        id: `featured-unpublished-${seriesId}`,
        severity: "error",
        category: "featured",
        message: `Unpublished series "${seriesId}" is still in For You (admin/featured).`,
        seriesId,
        targetId: seriesId,
      });
    }

    const orders = new Map<number, string>();
    for (const ep of eps) {
      const epData = ep.data();
      const order = typeof epData.order === "number" ? epData.order : 0;
      if (orders.has(order)) {
        issues.push({
          id: `dup-order-${seriesId}-${order}`,
          severity: "error",
          category: "episode_order",
          message: `Duplicate episode order ${order} in series "${seriesId}".`,
          seriesId,
          targetId: ep.id,
        });
      } else {
        orders.set(order, ep.id);
      }

      const videoUrl =
        typeof epData.videoUrl === "string" ? epData.videoUrl : "";
      if (
        !videoUrl.startsWith("http://") &&
        !videoUrl.startsWith("https://")
      ) {
        issues.push({
          id: `bad-video-${ep.id}`,
          severity: "error",
          category: "video_url",
          message: `Episode ${ep.id} has invalid videoUrl.`,
          seriesId,
          targetId: ep.id,
        });
      } else if (
        videoUrl.includes("res.cloudinary.com") &&
        !videoUrl.includes(".mp4") &&
        !videoUrl.includes("/video/upload/")
      ) {
        issues.push({
          id: `no-mp4-${ep.id}`,
          severity: "warn",
          category: "video_url",
          message: `Episode ${ep.id} Cloudinary URL may be missing .mp4 delivery format.`,
          seriesId,
          targetId: ep.id,
        });
      }

      const thumb =
        typeof epData.thumbnailUrl === "string" ? epData.thumbnailUrl : "";
      if (!thumb.startsWith("http")) {
        issues.push({
          id: `bad-thumb-${ep.id}`,
          severity: "warn",
          category: "thumbnail",
          message: `Episode ${ep.id} has missing or invalid thumbnailUrl.`,
          seriesId,
          targetId: ep.id,
        });
      }

      if (
        videoUrl &&
        !epData.cloudinaryVideoPublicId &&
        !cloudinaryPublicIdFromUrl(videoUrl)
      ) {
        issues.push({
          id: `no-cloudinary-id-${ep.id}`,
          severity: "warn",
          category: "indexing",
          message: `Episode ${ep.id} has no cloudinaryVideoPublicId (re-publish to index).`,
          seriesId,
          targetId: ep.id,
        });
      }
    }
  }

  return {
    issues,
    scannedSeries: seriesSnap.size,
    scannedEpisodes: episodesSnap.size,
  };
}

export async function repairSeriesStats(seriesId: string): Promise<void> {
  const meta = await getSeriesMeta(seriesId);
  await syncSeriesStats(seriesId, meta);
}
