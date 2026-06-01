import * as admin from 'firebase-admin';

export type TxType =
  | 'adReward'
  | 'dailyCheckIn'
  | 'purchase'
  | 'spend'
  | 'refund';

export interface LedgerEntry {
  userId: string;
  type: TxType;
  coinsDelta: number;
  bonusDelta: number;
  reference?: string;
}

export async function appendLedgerAndApply(
  entry: LedgerEntry,
): Promise<void> {
  const db = admin.firestore();
  const userRef = db.collection('users').doc(entry.userId);
  const txRef = userRef.collection('transactions').doc();

  const batch = db.batch();
  batch.set(txRef, {
    ...entry,
    id: txRef.id,
    at: admin.firestore.FieldValue.serverTimestamp(),
  });

  if (entry.coinsDelta !== 0) {
    batch.update(userRef, {
      coins: admin.firestore.FieldValue.increment(entry.coinsDelta),
    });
  }

  if (entry.bonusDelta !== 0) {
    batch.update(userRef, {
      bonus: admin.firestore.FieldValue.increment(entry.bonusDelta),
    });
  }

  await batch.commit();
}
