import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

export type DashboardMetrics = {
  seriesCount: number;
  episodeCount: number;
  totalDurationSec: number;
  vipSeriesCount: number;
  featuredSeriesCount: number;
  byProvider: { providerId: string; seriesCount: number; episodeCount: number }[];
  recentPublishes: {
    id: string;
    targetId: string | null;
    seriesId: string | null;
    createdAtLabel: string;
    actorEmail: string | null;
  }[];
};

function formatTimestamp(value: unknown): string {
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate().toLocaleString();
  }
  return "—";
}

export async function loadDashboardMetrics(
  scopeProviderId?: string | null,
): Promise<DashboardMetrics> {
  if (!db) {
    return {
      seriesCount: 0,
      episodeCount: 0,
      totalDurationSec: 0,
      vipSeriesCount: 0,
      featuredSeriesCount: 0,
      byProvider: [],
      recentPublishes: [],
    };
  }

  const seriesSnap = scopeProviderId
    ? await getDocs(
        query(
          collection(db, "series"),
          where("providerId", "==", scopeProviderId),
        ),
      )
    : await getDocs(collection(db, "series"));

  let episodeCount = 0;
  let totalDurationSec = 0;
  let vipSeriesCount = 0;
  const providerAgg = new Map<
    string,
    { seriesCount: number; episodeCount: number }
  >();

  for (const item of seriesSnap.docs) {
    const data = item.data();
    const count =
      typeof data.episodeCount === "number" ? data.episodeCount : 0;
    const duration =
      typeof data.totalDurationSec === "number" ? data.totalDurationSec : 0;
    episodeCount += count;
    totalDurationSec += duration;
    if (data.isVip === true) {
      vipSeriesCount += 1;
    }
    const pid =
      typeof data.providerId === "string" && data.providerId
        ? data.providerId
        : "_legacy";
    const bucket = providerAgg.get(pid) ?? { seriesCount: 0, episodeCount: 0 };
    bucket.seriesCount += 1;
    bucket.episodeCount += count;
    providerAgg.set(pid, bucket);
  }

  const featuredSnap = await getDoc(doc(db, "admin", "featured"));
  const featuredIds =
    featuredSnap.exists() &&
    Array.isArray(featuredSnap.data()?.seriesIds)
      ? (featuredSnap.data()?.seriesIds as string[])
      : [];
  const featuredSeriesCount = scopeProviderId
    ? featuredIds.filter((id) => {
        const match = seriesSnap.docs.find((d) => d.id === id);
        return match?.data()?.providerId === scopeProviderId;
      }).length
    : featuredIds.length;

  const auditConstraints = scopeProviderId
    ? [
        where("providerId", "==", scopeProviderId),
        where("action", "==", "episode.publish"),
        orderBy("createdAt", "desc"),
        limit(8),
      ]
    : [
        where("action", "==", "episode.publish"),
        orderBy("createdAt", "desc"),
        limit(8),
      ];

  let recentPublishes: DashboardMetrics["recentPublishes"] = [];
  try {
    const auditSnap = await getDocs(
      query(collection(db, "auditEvents"), ...auditConstraints),
    );
    recentPublishes = auditSnap.docs.map((item) => {
      const data = item.data();
      return {
        id: item.id,
        targetId: typeof data.targetId === "string" ? data.targetId : null,
        seriesId: typeof data.seriesId === "string" ? data.seriesId : null,
        createdAtLabel: formatTimestamp(data.createdAt),
        actorEmail:
          typeof data.actorEmail === "string" ? data.actorEmail : null,
      };
    });
  } catch {
    recentPublishes = [];
  }

  const byProvider = [...providerAgg.entries()]
    .map(([providerId, stats]) => ({
      providerId,
      seriesCount: stats.seriesCount,
      episodeCount: stats.episodeCount,
    }))
    .sort((a, b) => b.episodeCount - a.episodeCount);

  return {
    seriesCount: seriesSnap.size,
    episodeCount,
    totalDurationSec,
    vipSeriesCount,
    featuredSeriesCount,
    byProvider,
    recentPublishes,
  };
}
