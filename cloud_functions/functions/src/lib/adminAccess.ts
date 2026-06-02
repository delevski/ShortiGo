import { HttpsError } from 'firebase-functions/v2/https';

export function assertAdmin(auth: { uid: string; token: Record<string, unknown> } | null): string {
  if (!auth) {
    throw new HttpsError('unauthenticated', 'Sign in required');
  }

  const isClaimAdmin = auth.token.admin === true;
  const allowlist = (process.env.ADMIN_UIDS ?? '')
    .split(',')
    .map((uid) => uid.trim())
    .filter((uid) => uid.length > 0);

  if (!isClaimAdmin && !allowlist.includes(auth.uid)) {
    throw new HttpsError('permission-denied', 'Admin access required');
  }

  return auth.uid;
}
