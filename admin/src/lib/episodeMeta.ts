/** Firestore document id for an episode (what the mobile app loads). */
export function plannedEpisodeDocId(seriesId: string, order: number): string {
  return `${seriesId.trim()}_e${order}`;
}

/** Label shown in the mobile app list (no custom episode titles in schema). */
export function episodeAppLabel(order: number): string {
  return `EP.${order}`;
}

/** Cloudinary folder + public_id from a delivery or upload URL. */
export function cloudinaryPublicIdFromUrl(url: string): string | null {
  try {
    const pathname = new URL(url).pathname;
    const segments = pathname.split("/").filter(Boolean);
    const uploadIndex = segments.indexOf("upload");
    if (uploadIndex === -1) {
      return null;
    }
    const afterUpload = segments.slice(uploadIndex + 1);
    let start = 0;
    while (start < afterUpload.length) {
      const part = afterUpload[start];
      if (part.includes(",") || /^v\d+$/i.test(part)) {
        start += 1;
        continue;
      }
      break;
    }
    const publicId = afterUpload.slice(start).join("/");
    return publicId || null;
  } catch {
    return null;
  }
}

export function videoUrlContainsPublicId(
  videoUrl: string,
  publicId: string,
): boolean {
  const normalized = publicId.trim().replace(/^\/+|\/+$/g, "");
  if (!normalized) {
    return false;
  }
  return videoUrl.includes(normalized);
}
