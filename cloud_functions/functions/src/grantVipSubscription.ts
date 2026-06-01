import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';

interface RevenueCatEvent {
  app_user_id?: string;
  type?: string;
  expiration_at_ms?: number;
}

export const grantVipSubscription = onRequest(async (req, res) => {
  const authHeader = req.headers.authorization ?? '';
  if (authHeader !== `Bearer ${process.env.RC_WEBHOOK_SECRET ?? ''}`) {
    res.status(401).send('unauthorized');
    return;
  }

  const event = req.body?.event as RevenueCatEvent | undefined;
  if (!event) {
    res.status(400).send('missing event');
    return;
  }

  const appUserId = event.app_user_id;
  if (!appUserId) {
    res.status(400).send('missing app_user_id');
    return;
  }

  const active = event.type === 'INITIAL_PURCHASE' || event.type === 'RENEWAL';
  const expiresAt = event.expiration_at_ms
    ? admin.firestore.Timestamp.fromMillis(event.expiration_at_ms)
    : null;

  await admin.firestore().collection('users').doc(appUserId).update({
    isVip: active,
    vipExpiresAt: expiresAt,
  });

  res.status(200).send('ok');
});
