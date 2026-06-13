import { Timestamp } from "firebase/firestore";
import type {
  AppUser,
  CategoryId,
  Episode,
  Series,
  WalletTransaction,
} from "../domain/types";

type Raw = Record<string, unknown>;

export function mapSeries(id: string, data: Raw): Series {
  return {
    id,
    title: stringValue(data.title),
    description: stringValue(data.description),
    coverUrl: stringValue(data.coverUrl),
    category: categoryValue(data.category),
    isVip: booleanValue(data.isVip, false),
    episodeCount: numberValue(data.episodeCount),
    totalDurationSec: numberValue(data.totalDurationSec),
    createdAt: dateValue(data.createdAt),
    popularity: numberValue(data.popularity),
    watchCount: numberValue(data.watchCount),
    saveCount: numberValue(data.saveCount),
    followerCount: numberValue(data.followerCount),
    isPublished: booleanValue(data.isPublished, true),
  };
}

export function mapEpisode(id: string, data: Raw): Episode {
  const bonusUnlockCost = optionalNumber(data.bonusUnlockCost);
  return {
    id,
    seriesId: stringValue(data.seriesId),
    order: numberValue(data.order),
    videoUrl: stringValue(data.videoUrl),
    thumbnailUrl: stringValue(data.thumbnailUrl),
    durationSec: numberValue(data.durationSec),
    isVipLocked: booleanValue(data.isVipLocked, false),
    ...(bonusUnlockCost === undefined ? {} : { bonusUnlockCost }),
    watchCount: numberValue(data.watchCount),
    likeCount: numberValue(data.likeCount),
    shareCount: numberValue(data.shareCount),
  };
}

export function mapUser(id: string, data: Raw): AppUser {
  return {
    id,
    email: stringValue(data.email),
    displayName: optionalString(data.displayName),
    photoUrl: optionalString(data.photoUrl),
    isVip: booleanValue(data.isVip, false),
    vipExpiresAt: optionalDate(data.vipExpiresAt),
    coins: numberValue(data.coins),
    bonus: numberValue(data.bonus),
    favoriteSeriesIds: stringList(data.favoriteSeriesIds),
    unlockedEpisodeIds: stringList(data.unlockedEpisodeIds),
    likedEpisodeIds: stringList(data.likedEpisodeIds),
    followedSeriesIds: stringList(data.followedSeriesIds),
    lastDailyCheckIn: optionalDate(data.lastDailyCheckIn),
    createdAt: dateValue(data.createdAt),
  };
}

export function mapTransaction(id: string, data: Raw): WalletTransaction {
  return {
    id,
    userId: stringValue(data.userId),
    type: stringValue(data.type),
    amount: numberValue(data.amount),
    balanceType: data.balanceType === "coins" ? "coins" : "bonus",
    createdAt: dateValue(data.createdAt),
    description: optionalString(data.description),
  };
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function numberValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function booleanValue(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function categoryValue(value: unknown): CategoryId {
  const allowed = new Set(["forYou", "new", "hot", "adventure", "scary", "anime", "vip"]);
  return typeof value === "string" && allowed.has(value) ? (value as CategoryId) : "new";
}

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function dateValue(value: unknown): Date {
  return optionalDate(value) ?? new Date(0);
}

function optionalDate(value: unknown): Date | undefined {
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate();
  }
  return undefined;
}
