import * as admin from 'firebase-admin';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { assertAdmin } from './lib/adminAccess';

type UploadInitRequest = {
  seriesId: unknown;
  order: unknown;
};

function normalizeSeriesId(value: unknown): string {
  if (typeof value !== 'string') {
    throw new HttpsError('invalid-argument', 'seriesId must be a string');
  }
  const normalized = value.trim();
  if (!/^[a-zA-Z0-9_-]{2,64}$/.test(normalized)) {
    throw new HttpsError('invalid-argument', 'seriesId has invalid format');
  }
  return normalized;
}

function normalizeOrder(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    throw new HttpsError('invalid-argument', 'order must be a positive integer');
  }
  return value;
}

function resolveBucketName(): string {
  return (
    process.env.FIREBASE_STORAGE_BUCKET ??
    admin.app().options.storageBucket ??
    'shortigo-prod.firebasestorage.app'
  );
}

export const uploadInit = onCall(async (request) => {
  assertAdmin(request.auth as { uid: string; token: Record<string, unknown> } | null);

  const { seriesId, order } = request.data as UploadInitRequest;
  const safeSeriesId = normalizeSeriesId(seriesId);
  const safeOrder = normalizeOrder(order);

  const episodeId = `${safeSeriesId}_e${safeOrder}`;
  const videoPath = `series/${safeSeriesId}/episodes/${episodeId}.mp4`;
  const thumbnailPath = `series/${safeSeriesId}/thumbnails/${episodeId}.jpg`;
  const bucketName = resolveBucketName();
  const bucket = admin.storage().bucket(bucketName);
  const expiresAt = Date.now() + 15 * 60 * 1000;

  const [videoUploadUrl] = await bucket.file(videoPath).getSignedUrl({
    action: 'write',
    version: 'v4',
    expires: expiresAt,
    contentType: 'video/mp4',
  });

  const [thumbnailUploadUrl] = await bucket.file(thumbnailPath).getSignedUrl({
    action: 'write',
    version: 'v4',
    expires: expiresAt,
    contentType: 'image/jpeg',
  });

  return {
    episodeId,
    bucket: bucketName,
    videoPath,
    thumbnailPath,
    videoUploadUrl,
    thumbnailUploadUrl,
  };
});
