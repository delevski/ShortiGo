import type { User } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type Firestore,
  type Unsubscribe,
} from "firebase/firestore";
import type { AppUser, WalletTransaction } from "../domain/types";
import { mapTransaction, mapUser } from "./firestoreMappers";

export function watchAppUser(
  db: Firestore,
  uid: string,
  onNext: (user: AppUser | null) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, "users", uid),
    (snapshot) => onNext(snapshot.exists() ? mapUser(snapshot.id, snapshot.data()) : null),
    onError,
  );
}

export async function ensureUserDoc(db: Firestore, authUser: User): Promise<void> {
  const ref = doc(db, "users", authUser.uid);
  const existing = await getDoc(ref);
  if (existing.exists()) return;
  await setDoc(ref, {
    id: authUser.uid,
    email: authUser.email ?? "",
    displayName: authUser.displayName ?? null,
    photoUrl: authUser.photoURL ?? null,
    isVip: false,
    vipExpiresAt: null,
    coins: 0,
    bonus: 0,
    favoriteSeriesIds: [],
    unlockedEpisodeIds: [],
    likedEpisodeIds: [],
    followedSeriesIds: [],
    createdAt: serverTimestamp(),
  });
}

export async function fetchTransactions(db: Firestore, uid: string): Promise<WalletTransaction[]> {
  const snap = await getDocs(
    query(collection(db, "users", uid, "transactions"), orderBy("at", "desc"), limit(25)),
  );
  return snap.docs.map((item) => mapTransaction(item.id, item.data()));
}
