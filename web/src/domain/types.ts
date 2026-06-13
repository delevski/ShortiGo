export type CategoryId =
  | "forYou"
  | "new"
  | "hot"
  | "adventure"
  | "scary"
  | "anime"
  | "vip";

export type Series = {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  category: CategoryId;
  isVip: boolean;
  episodeCount: number;
  totalDurationSec: number;
  createdAt: Date;
  popularity: number;
  watchCount: number;
  saveCount: number;
  followerCount: number;
  isPublished: boolean;
};

export type Episode = {
  id: string;
  seriesId: string;
  order: number;
  videoUrl: string;
  thumbnailUrl: string;
  durationSec: number;
  isVipLocked: boolean;
  bonusUnlockCost?: number;
  watchCount: number;
  likeCount: number;
  shareCount: number;
};

export type AppUser = {
  id: string;
  email: string;
  displayName?: string;
  photoUrl?: string;
  isVip: boolean;
  vipExpiresAt?: Date;
  coins: number;
  bonus: number;
  favoriteSeriesIds: string[];
  unlockedEpisodeIds: string[];
  likedEpisodeIds: string[];
  followedSeriesIds: string[];
  lastDailyCheckIn?: Date;
  createdAt: Date;
};

export type WalletTransaction = {
  id: string;
  userId: string;
  type: "adReward" | "dailyCheckIn" | "purchase" | "spend" | "refund" | "unknown";
  coinsDelta: number;
  bonusDelta: number;
  reference?: string;
  at: Date;
};

export const categories: { id: CategoryId; label: string }[] = [
  { id: "forYou", label: "For You" },
  { id: "new", label: "New" },
  { id: "hot", label: "Hot" },
  { id: "adventure", label: "Adventure" },
  { id: "scary", label: "Scary" },
  { id: "anime", label: "Anime" },
  { id: "vip", label: "VIP" },
];
