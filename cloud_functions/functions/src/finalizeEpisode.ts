import * as admin from 'firebase-admin';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { assertAdmin } from './lib/adminAccess';

type FinalizeEpisodeRequest = {
  seriesId: unknown;
  order: unknown;
  isVipLocked: unknown;
  durationSec: unknown;
  bucket: unknown;
  videoPath: unknown;
  thumbnailPath: unknown;
  replaceExisting?: unknown;
};

function assertString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new HttpsError('invalid-argument', `${field} must be a non-empty string`);
  }
  return value.trim();
}

function assertPositiveInt(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    throw new HttpsError('invalid-argument', `${field} must be a positive integer`);
  }
  return value;
}

function assertBoolean(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') {
    throw new HttpsError('invalid-argument', `${field} must be boolean`);
  }
  return value;
}

function storageHttpUrl(bucket: string, objectPath: string): string {
  const encoded = encodeURIComponent(objectPath);
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encoded}?alt=media`;
}

export const finalizeEpisode = onCall(async (request) => {
  assertAdmin(request.auth as { uid: string; token: Record<string, unknown> } | null);

  const body = request.data as FinalizeEpisodeRequest;
  const seriesId = assertString(body.seriesId, 'seriesId');
  const order = assertPositiveInt(body.order, 'order');
  const durationSec = assertPositiveInt(body.durationSec, 'durationSec');
  const isVipLocked = assertBoolean(body.isVipLocked, 'isVipLocked');
  const bucket = assertString(body.bucket, 'bucket');
  const videoPath = assertString(body.videoPath, 'videoPath');
  const thumbnailPath = assertString(body.thumbnailPath, 'thumbnailPath');
  const replaceExisting = body.replaceExisting === true;

  const episodeId = `${seriesId}_e${order}`;

  if (!videoPath.endsWith(`/${episodeId}.mp4`)) {
    throw new HttpsError('invalid-argument', 'videoPath does not match schema');
  }
  if (!thumbnailPath.endsWith(`/${episodeId}.jpg`)) {
    throw new HttpsError('invalid-argument', 'thumbnailPath does not match schema');
  }

  const episodeRef = admin.firestore().collection('episodes').doc(episodeId);
  const episodeSnap = await episodeRef.get();
  if (episodeSnap.exists && !replaceExisting) {
    throw new HttpsError('already-exists', `Episode ${episodeId} already exists`);
  }

  const [videoExists] = await admin.storage().bucket(bucket).file(videoPath).exists();
  const [thumbnailExists] = await admin.storage().bucket(bucket).file(thumbnailPath).exists();
  if (!videoExists || !thumbnailExists) {
    throw new HttpsError('failed-precondition', 'Uploaded files were not found in storage');
  }

  await episodeRef.set({
    id: episodeId,
    seriesId,
    order,
    videoUrl: videoPath,
    thumbnailUrl: storageHttpUrl(bucket, thumbnailPath),
    durationSec,
    isVipLocked,
  });

  return { episodeId };
});
