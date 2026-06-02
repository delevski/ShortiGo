import { AppError } from "./appError";
import { cloudinaryPublicIdFromUrl } from "./episodeMeta";
import { logInfo } from "./logger";

export type CloudinaryAssetRef = {
  publicId: string;
  resourceType: "video" | "image";
};

export function cloudinaryAssetsFromUrls(
  videoUrl: string,
  thumbnailUrl: string,
): CloudinaryAssetRef[] {
  const assets: CloudinaryAssetRef[] = [];
  const seen = new Set<string>();

  function add(url: string, resourceType: "video" | "image") {
    if (!url.includes("res.cloudinary.com")) {
      return;
    }
    let publicId = cloudinaryPublicIdFromUrl(url);
    if (!publicId) {
      return;
    }
    if (resourceType === "video") {
      publicId = publicId.replace(/\.(jpg|jpeg|png|webp)$/i, "");
    }
    const key = `${resourceType}:${publicId}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    assets.push({ publicId, resourceType });
  }

  add(videoUrl, "video");
  if (thumbnailUrl.trim()) {
    add(thumbnailUrl, "image");
  }

  return assets;
}

export async function deleteCloudinaryAssets(
  assets: CloudinaryAssetRef[],
): Promise<void> {
  if (assets.length === 0) {
    return;
  }

  logInfo("Deleting Cloudinary assets", {
    count: assets.length,
    publicIds: assets.map((a) => a.publicId),
  });

  const response = await fetch("/api/cloudinary/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assets }),
  });

  const payload = (await response.json()) as {
    error?: string;
    ok?: boolean;
    results?: { publicId: string; result: string }[];
  };

  if (!response.ok) {
    throw new AppError(
      payload.error ??
        `Cloudinary delete failed (HTTP ${response.status}). Add CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to admin/.env.`,
      "CLOUDINARY_DELETE_FAILED",
      { status: response.status, assets },
    );
  }

  const notFound = (payload.results ?? []).filter(
    (item) => item.result !== "ok" && item.result !== "not found",
  );
  if (notFound.length > 0) {
    logInfo("Some Cloudinary deletes returned non-ok", { notFound });
  }
}
