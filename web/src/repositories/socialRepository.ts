import { doc, runTransaction, type Firestore } from "firebase/firestore";

export function toggleArray(items: string[], id: string, enabled: boolean): string[] {
  if (enabled) return items.includes(id) ? items : [...items, id];
  return items.filter((item) => item !== id);
}

export function nextCount(current: unknown, delta: number): number {
  const count = typeof current === "number" ? current : 0;
  return Math.max(0, count + delta);
}

export async function setEpisodeLiked(
  db: Firestore,
  userId: string,
  episodeId: string,
  liked: boolean,
): Promise<void> {
  const userRef = doc(db, "users", userId);
  const episodeRef = doc(db, "episodes", episodeId);
  await runTransaction(db, async (transaction) => {
    const user = await transaction.get(userRef);
    const episode = await transaction.get(episodeRef);
    const likedIds = stringList(user.data()?.likedEpisodeIds);
    const alreadyLiked = likedIds.includes(episodeId);
    if (liked === alreadyLiked) return;
    transaction.update(userRef, { likedEpisodeIds: toggleArray(likedIds, episodeId, liked) });
    transaction.update(episodeRef, {
      likeCount: nextCount(episode.data()?.likeCount, liked ? 1 : -1),
    });
  });
}

export async function setSeriesSaved(
  db: Firestore,
  userId: string,
  seriesId: string,
  saved: boolean,
): Promise<void> {
  const userRef = doc(db, "users", userId);
  const seriesRef = doc(db, "series", seriesId);
  await runTransaction(db, async (transaction) => {
    const user = await transaction.get(userRef);
    const series = await transaction.get(seriesRef);
    const savedIds = stringList(user.data()?.favoriteSeriesIds);
    const alreadySaved = savedIds.includes(seriesId);
    if (saved === alreadySaved) return;
    transaction.update(userRef, { favoriteSeriesIds: toggleArray(savedIds, seriesId, saved) });
    transaction.update(seriesRef, {
      saveCount: nextCount(series.data()?.saveCount, saved ? 1 : -1),
    });
  });
}

export async function setSeriesFollowed(
  db: Firestore,
  userId: string,
  seriesId: string,
  followed: boolean,
): Promise<void> {
  const userRef = doc(db, "users", userId);
  const seriesRef = doc(db, "series", seriesId);
  await runTransaction(db, async (transaction) => {
    const user = await transaction.get(userRef);
    const series = await transaction.get(seriesRef);
    const followedIds = stringList(user.data()?.followedSeriesIds);
    const alreadyFollowed = followedIds.includes(seriesId);
    if (followed === alreadyFollowed) return;
    transaction.update(userRef, {
      followedSeriesIds: toggleArray(followedIds, seriesId, followed),
    });
    transaction.update(seriesRef, {
      followerCount: nextCount(series.data()?.followerCount, followed ? 1 : -1),
    });
  });
}

export async function recordEpisodeShare(db: Firestore, episodeId: string): Promise<void> {
  const episodeRef = doc(db, "episodes", episodeId);
  await runTransaction(db, async (transaction) => {
    const episode = await transaction.get(episodeRef);
    transaction.update(episodeRef, { shareCount: nextCount(episode.data()?.shareCount, 1) });
  });
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}
