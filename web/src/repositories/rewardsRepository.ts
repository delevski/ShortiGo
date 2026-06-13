import type { Auth } from "firebase/auth";
import {
  collection,
  doc,
  increment,
  runTransaction,
  serverTimestamp,
  setDoc,
  type Firestore,
} from "firebase/firestore";

export function shouldUseRewardApi(baseUrl: string): boolean {
  return baseUrl.trim().length > 0;
}

export function canClaimDailyCheckIn(lastDailyCheckIn: Date | undefined, now = new Date()): boolean {
  if (!lastDailyCheckIn) return true;
  return utcDateKey(lastDailyCheckIn) !== utcDateKey(now);
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
    const last = user.data()?.lastDailyCheckIn;
    const lastDate = last && typeof last.toDate === "function" ? last.toDate() : undefined;
    if (!canClaimDailyCheckIn(lastDate)) return;
    transaction.update(userRef, {
      bonus: increment(12),
      lastDailyCheckIn: serverTimestamp(),
    });
    transaction.set(transactionRef, {
      userId: params.userId,
      type: "daily_check_in",
      amount: 12,
      balanceType: "bonus",
      description: "Daily check-in",
      createdAt: serverTimestamp(),
    });
  });
}

export async function grantWebAdReward(db: Firestore, userId: string): Promise<void> {
  const transactionRef = doc(collection(db, "users", userId, "transactions"));
  await setDoc(transactionRef, {
    userId,
    type: "web_reward",
    amount: 12,
    balanceType: "bonus",
    description: "Web reward",
    createdAt: serverTimestamp(),
  });
  await runTransaction(db, async (transaction) => {
    const userRef = doc(db, "users", userId);
    transaction.update(userRef, { bonus: increment(12) });
  });
}

function utcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}
