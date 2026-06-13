import type { Auth } from "firebase/auth";
import {
  collection,
  doc,
  increment,
  runTransaction,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";

const DAILY_CHECK_IN_BONUS = 5;
const WEB_AD_REWARD_BONUS = 12;

export function dailyCheckInLedgerPayload<T>(userId: string, at: T) {
  return {
    userId,
    type: "dailyCheckIn",
    coinsDelta: 0,
    bonusDelta: DAILY_CHECK_IN_BONUS,
    reference: "dailyCheckIn",
    at,
  };
}

export function adRewardLedgerPayload<T>(userId: string, at: T) {
  return {
    userId,
    type: "adReward",
    coinsDelta: 0,
    bonusDelta: WEB_AD_REWARD_BONUS,
    reference: "webReward",
    at,
  };
}

export function shouldUseRewardApi(baseUrl: string): boolean {
  return baseUrl.trim().length > 0;
}

export function canClaimDailyCheckIn(lastDailyCheckIn: Date | string | undefined, now = new Date()): boolean {
  const lastDate = storedDate(lastDailyCheckIn);
  if (!lastDate) return true;
  return utcDateKey(lastDate) !== utcDateKey(now);
}

export async function claimDailyCheckIn(params: {
  db: Firestore;
  auth: Auth;
  userId: string;
  rewardApiBaseUrl: string;
}): Promise<void> {
  if (shouldUseRewardApi(params.rewardApiBaseUrl)) {
    const token = await params.auth.currentUser?.getIdToken();
    const response = await fetch(`${params.rewardApiBaseUrl.replace(/\/+$/, "")}/daily-check-in`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) throw new Error("Daily check-in failed");
    return;
  }

  const userRef = doc(params.db, "users", params.userId);
  const transactionRef = doc(collection(params.db, "users", params.userId, "transactions"));
  await runTransaction(params.db, async (transaction) => {
    const user = await transaction.get(userRef);
    if (!canClaimDailyCheckIn(user.data()?.lastDailyCheckIn)) return;
    const at = serverTimestamp();
    transaction.update(userRef, {
      bonus: increment(DAILY_CHECK_IN_BONUS),
      lastDailyCheckIn: at,
    });
    transaction.set(transactionRef, dailyCheckInLedgerPayload(params.userId, at));
  });
}

export async function grantWebAdReward(db: Firestore, userId: string): Promise<void> {
  const transactionRef = doc(collection(db, "users", userId, "transactions"));
  await runTransaction(db, async (transaction) => {
    const userRef = doc(db, "users", userId);
    transaction.update(userRef, { bonus: increment(WEB_AD_REWARD_BONUS) });
    transaction.set(transactionRef, adRewardLedgerPayload(userId, serverTimestamp()));
  });
}

function utcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function storedDate(value: unknown): Date | undefined {
  if (value instanceof Date) return value;
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate();
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }
  return undefined;
}
