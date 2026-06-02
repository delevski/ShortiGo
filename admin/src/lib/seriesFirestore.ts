import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

export type SeriesMeta = {
  title: string;
  coverUrl: string;
  category: string;
  isVip: boolean;
};

export type SeriesRecord = SeriesMeta & {
  id: string;
  episodeCount: number;
  totalDurationSec: number;
  isPublished: boolean;
};

export async function fetchNextEpisodeOrder(seriesId: string): Promise<number> {
  if (!db || !seriesId.trim()) {
    return 1;
  }
  const snap = await getDocs(
    query(collection(db, "episodes"), where("seriesId", "==", seriesId.trim())),
  );
  let maxOrder = 0;
  for (const item of snap.docs) {
    const order = item.data().order;
    if (typeof order === "number" && order > maxOrder) {
      maxOrder = order;
    }
  }
  return maxOrder + 1;
}

export async function syncSeriesStats(
  seriesId: string,
  meta: SeriesMeta,
): Promise<{ episodeCount: number; totalDurationSec: number }> {
  if (!db) {
    return { episodeCount: 0, totalDurationSec: 0 };
  }

  const snap = await getDocs(
    query(collection(db, "episodes"), where("seriesId", "==", seriesId)),
  );

  let totalDurationSec = 0;
  for (const item of snap.docs) {
    const duration = item.data().durationSec;
    if (typeof duration === "number") {
      totalDurationSec += duration;
    }
  }
  const episodeCount = snap.size;
  const seriesRef = doc(db, "series", seriesId);
  const existing = await getDoc(seriesRef);

  const fields = {
    id: seriesId,
    title: meta.title,
    coverUrl: meta.coverUrl,
    category: meta.category,
    isVip: meta.isVip,
    episodeCount,
    totalDurationSec,
    isPublished: episodeCount > 0,
  };

  if (!existing.exists()) {
    await setDoc(seriesRef, {
      ...fields,
      description: "",
      createdAt: serverTimestamp(),
      popularity: 0,
    });
  } else {
    await setDoc(seriesRef, fields, { merge: true });
  }

  return { episodeCount, totalDurationSec };
}

export async function ensureSeriesDoc(
  seriesId: string,
  meta: SeriesMeta,
): Promise<void> {
  if (!db) {
    return;
  }
  const seriesRef = doc(db, "series", seriesId);
  const existing = await getDoc(seriesRef);
  const baseFields = {
    id: seriesId,
    title: meta.title,
    coverUrl: meta.coverUrl,
    category: meta.category,
    isVip: meta.isVip,
    isPublished: true,
  };
  if (existing.exists()) {
    await setDoc(seriesRef, baseFields, { merge: true });
  } else {
    await setDoc(seriesRef, {
      ...baseFields,
      description: "",
      createdAt: serverTimestamp(),
      popularity: 0,
      episodeCount: 0,
      totalDurationSec: 0,
    });
  }
}

export async function fetchAllSeries(): Promise<SeriesRecord[]> {
  if (!db) {
    return [];
  }
  const snap = await getDocs(collection(db, "series"));
  const rows: SeriesRecord[] = snap.docs.map((item) => {
    const data = item.data();
    return {
      id: item.id,
      title: typeof data.title === "string" ? data.title : item.id,
      coverUrl: typeof data.coverUrl === "string" ? data.coverUrl : "",
      category: typeof data.category === "string" ? data.category : "new",
      isVip: data.isVip === true,
      episodeCount:
        typeof data.episodeCount === "number" ? data.episodeCount : 0,
      totalDurationSec:
        typeof data.totalDurationSec === "number" ? data.totalDurationSec : 0,
      isPublished: data.isPublished !== false,
    };
  });
  rows.sort((a, b) => a.title.localeCompare(b.title));
  return rows;
}

export async function getSeriesMeta(seriesId: string): Promise<SeriesMeta> {
  if (!db) {
    return {
      title: seriesId,
      coverUrl: "",
      category: "new",
      isVip: false,
    };
  }
  const snap = await getDoc(doc(db, "series", seriesId));
  if (!snap.exists()) {
    return {
      title: seriesId,
      coverUrl: "",
      category: "new",
      isVip: false,
    };
  }
  const data = snap.data();
  return {
    title: typeof data.title === "string" ? data.title : seriesId,
    coverUrl: typeof data.coverUrl === "string" ? data.coverUrl : "",
    category: typeof data.category === "string" ? data.category : "new",
    isVip: data.isVip === true,
  };
}
