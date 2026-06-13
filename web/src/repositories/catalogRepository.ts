import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  limit as limitQuery,
  orderBy,
  query,
  where,
  type Firestore,
  type WhereFilterOp,
} from "firebase/firestore";
import type { CategoryId, Episode, Series } from "../domain/types";
import { mapEpisode, mapSeries } from "./firestoreMappers";

export type CategoryQuerySpec = {
  field: string;
  op: WhereFilterOp;
  value: string | boolean;
  orderField: string;
  direction: "asc" | "desc";
};

export function categoryQuerySpec(category: Exclude<CategoryId, "forYou">): CategoryQuerySpec {
  if (category === "vip") {
    return { field: "isVip", op: "==", value: true, orderField: "createdAt", direction: "desc" };
  }
  return {
    field: "category",
    op: "==",
    value: category,
    orderField: category === "hot" ? "popularity" : "createdAt",
    direction: "desc",
  };
}

export function orderedFeaturedIds(ids: string[], available: Set<string>, max: number): string[] {
  return ids.filter((id) => available.has(id)).slice(0, max);
}

export function chunkIds(ids: string[], size = 10): string[][] {
  const chunks: string[][] = [];
  for (let index = 0; index < ids.length; index += size) {
    chunks.push(ids.slice(index, index + size));
  }
  return chunks;
}

export async function fetchForYouSeries(db: Firestore, max = 20): Promise<Series[]> {
  const featured = await getDoc(doc(db, "admin", "featured"));
  const ids = Array.isArray(featured.data()?.seriesIds)
    ? featured.data()!.seriesIds.filter((id: unknown): id is string => typeof id === "string")
    : [];
  if (ids.length === 0) return [];

  const chunks = chunkIds(ids, 10);
  const docs = await Promise.all(
    chunks.map((part) =>
      getDocs(query(collection(db, "series"), where(documentId(), "in", part))),
    ),
  );
  const byId = new Map(
    docs
      .flatMap((snap) => snap.docs)
      .map((item) => [item.id, mapSeries(item.id, item.data())] as const),
  );
  return orderedFeaturedIds(ids, new Set(byId.keys()), max)
    .map((id) => byId.get(id)!)
    .filter((series) => series.isPublished);
}

export async function fetchSeriesByCategory(
  db: Firestore,
  category: CategoryId,
  max = 20,
): Promise<Series[]> {
  if (category === "forYou") return fetchForYouSeries(db, max);
  const spec = categoryQuerySpec(category);
  const snap = await getDocs(
    query(
      collection(db, "series"),
      where("isPublished", "==", true),
      where(spec.field, spec.op, spec.value),
      orderBy(spec.orderField, spec.direction),
      limitQuery(max),
    ),
  );
  return snap.docs.map((item) => mapSeries(item.id, item.data()));
}

export async function fetchSeriesById(db: Firestore, seriesId: string): Promise<Series | null> {
  const snap = await getDoc(doc(db, "series", seriesId));
  return snap.exists() ? mapSeries(snap.id, snap.data()) : null;
}

export async function fetchSeriesByIds(db: Firestore, ids: string[]): Promise<Series[]> {
  const uniqueIds = [...new Set(ids)].filter(Boolean);
  if (uniqueIds.length === 0) return [];
  const snaps = await Promise.all(
    chunkIds(uniqueIds, 10).map((part) =>
      getDocs(query(collection(db, "series"), where(documentId(), "in", part))),
    ),
  );
  const byId = new Map(
    snaps
      .flatMap((snap) => snap.docs)
      .map((item) => [item.id, mapSeries(item.id, item.data())] as const),
  );
  return uniqueIds.map((id) => byId.get(id)).filter((item): item is Series => Boolean(item));
}

export async function fetchEpisodesBySeriesId(db: Firestore, seriesId: string): Promise<Episode[]> {
  const snap = await getDocs(
    query(collection(db, "episodes"), where("seriesId", "==", seriesId), orderBy("order", "asc")),
  );
  return snap.docs.map((item) => mapEpisode(item.id, item.data()));
}

export async function fetchEpisodeById(db: Firestore, episodeId: string): Promise<Episode | null> {
  const snap = await getDoc(doc(db, "episodes", episodeId));
  return snap.exists() ? mapEpisode(snap.id, snap.data()) : null;
}
