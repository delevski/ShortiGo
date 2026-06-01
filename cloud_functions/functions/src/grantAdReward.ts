import * as admin from 'firebase-admin';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { appendLedgerAndApply } from './lib/ledger';

const DAILY_CAP = 50;
const REWARD_AMOUNT = 12;

export const grantAdReward = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in required');
  }

  const userId = request.auth.uid;
  const { adUnitId, adId } = request.data as {
    adUnitId: unknown;
    adId: unknown;
  };
  if (typeof adUnitId !== 'string' || typeof adId !== 'string') {
    throw new HttpsError(
      'invalid-argument',
      'Missing adUnitId or adId',
    );
  }

  const since = admin.firestore.Timestamp.fromMillis(
    Date.now() - 24 * 60 * 60 * 1000,
  );
  const todayTx = await admin
    .firestore()
    .collection('users')
    .doc(userId)
    .collection('transactions')
    .where('type', '==', 'adReward')
    .where('at', '>=', since)
    .get();

  if (todayTx.size >= DAILY_CAP) {
    throw new HttpsError('resource-exhausted', 'Daily ad cap reached');
  }

  await appendLedgerAndApply({
    userId,
    type: 'adReward',
    coinsDelta: 0,
    bonusDelta: REWARD_AMOUNT,
    reference: `${adUnitId}:${adId}`,
  });

  return { ok: true, bonusDelta: REWARD_AMOUNT };
});
