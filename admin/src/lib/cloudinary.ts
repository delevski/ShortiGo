import { logError, logInfo } from "./logger";
import {
  assertFileWithinLimit,
  buildUploadError,
} from "./uploadErrors";
import { AppError } from "./appError";

export type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
  duration?: number;
  version?: number;
  format?: string;
  resource_type?: string;
};

export type UploadProgress = {
  loaded: number;
  total: number;
};

export { formatFileSize } from "./format";

/** Valid for video delivery — g_auto cannot share a component with c_fill (Cloudinary 400). */
const VIDEO_TRANSFORMS = "c_fill,ar_9:16,q_auto";
const THUMB_TRANSFORMS = "so_1,c_fill,ar_9:16,g_auto";

export function cloudinaryConfigError(): string | null {
  if (!import.meta.env.VITE_CLOUDINARY_CLOUD_NAME) {
    return "Missing VITE_CLOUDINARY_CLOUD_NAME";
  }
  if (!import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET) {
    return "Missing VITE_CLOUDINARY_UPLOAD_PRESET";
  }
  return null;
}

function stripVideoExtension(publicId: string): string {
  return publicId.replace(/\.(mp4|mov|webm|m4v|mkv)$/i, "");
}

/** Insert or replace transformation segment on a Cloudinary delivery URL. */
export function applyCloudinaryTransforms(
  secureUrl: string,
  transforms: string,
): string {
  const uploadToken = "/upload/";
  const index = secureUrl.indexOf(uploadToken);
  if (index === -1) {
    return secureUrl;
  }
  const prefix = secureUrl.slice(0, index + uploadToken.length);
  let rest = secureUrl.slice(index + uploadToken.length);
  const firstSlash = rest.indexOf("/");
  if (firstSlash > 0 && rest.slice(0, firstSlash).includes(",")) {
    rest = rest.slice(firstSlash + 1);
  }
  return `${prefix}${transforms}/${rest}`;
}

/** Ensures video URLs end with .mp4 for players that require a file extension. */
export function ensureVideoExtension(url: string, format = "mp4"): string {
  if (!url.includes("res.cloudinary.com") || !url.includes("/video/upload/")) {
    return url;
  }
  if (/\.(mp4|mov|webm|m4v)(\?|#|$)/i.test(url)) {
    return url;
  }
  const [base, query] = url.split("?", 2);
  const hashIdx = base.indexOf("#");
  if (hashIdx !== -1) {
    return `${base.slice(0, hashIdx)}.${format}${base.slice(hashIdx)}${query ? `?${query}` : ""}`;
  }
  return query ? `${base}.${format}?${query}` : `${base}.${format}`;
}

export function repairCloudinaryVideoUrl(url: string): string {
  if (!url.includes("res.cloudinary.com") || !url.includes("/video/upload/")) {
    return url;
  }

  const needsRepair =
    url.includes("g_auto,q_auto") ||
    url.includes("g_auto,f_mp4") ||
    url.includes(",f_mp4/");

  if (!needsRepair) {
    return ensureVideoExtension(url);
  }

  const publicId = cloudinaryPublicIdFromPath(url);
  if (!publicId) {
    return ensureVideoExtension(url);
  }

  const cloudMatch = url.match(/res\.cloudinary\.com\/([^/]+)/);
  const cloudName =
    cloudMatch?.[1] ??
    (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string);
  const versionMatch = url.match(/\/(v\d+)\//);
  const versionPrefix = versionMatch ? `${versionMatch[1]}/` : "";
  const pid = stripVideoExtension(publicId);
  const format = publicId.match(/\.(mp4|mov|webm)$/i)?.[1] ?? "mp4";

  return `https://res.cloudinary.com/${cloudName}/video/upload/${VIDEO_TRANSFORMS}/${versionPrefix}${pid}.${format}`;
}

export function cloudinaryVideoDeliveryUrl(
  result: CloudinaryUploadResult,
): string {
  const format = (result.format ?? "mp4").toLowerCase();

  if (result.secure_url?.includes("res.cloudinary.com")) {
    const withTransforms = applyCloudinaryTransforms(
      result.secure_url,
      VIDEO_TRANSFORMS,
    );
    return repairCloudinaryVideoUrl(
      ensureVideoExtension(withTransforms, format),
    );
  }

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
  const versionPrefix = result.version ? `v${result.version}/` : "";
  const publicId = stripVideoExtension(result.public_id);
  return `https://res.cloudinary.com/${cloudName}/video/upload/${VIDEO_TRANSFORMS}/${versionPrefix}${publicId}.${format}`;
}

export function cloudinaryGeneratedThumbnailUrl(
  result: CloudinaryUploadResult,
): string {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
  const versionPrefix = result.version ? `v${result.version}/` : "";
  const publicId = stripVideoExtension(result.public_id);
  return `https://res.cloudinary.com/${cloudName}/video/upload/${THUMB_TRANSFORMS}/${versionPrefix}${publicId}.jpg`;
}

/** Fix legacy CRM URLs missing .mp4 or using image/upload for thumbnails. */
export function normalizeCloudinaryEpisodeUrls(
  videoUrl: string,
  thumbnailUrl: string,
): { videoUrl: string; thumbnailUrl: string } {
  let video = videoUrl.trim();
  let thumb = thumbnailUrl.trim();

  if (video.includes("res.cloudinary.com")) {
    video = repairCloudinaryVideoUrl(ensureVideoExtension(video));
  }

  if (
    thumb.includes("res.cloudinary.com") &&
    thumb.includes("/image/upload/") &&
    video.includes("/video/upload/")
  ) {
    const publicId = stripVideoExtension(
      cloudinaryPublicIdFromPath(video) ?? "",
    );
    if (publicId) {
      const cloudMatch = thumb.match(/res\.cloudinary\.com\/([^/]+)/);
      const cloudName =
        cloudMatch?.[1] ??
        (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string);
      const versionMatch = video.match(/\/v(\d+)\//);
      const versionPrefix = versionMatch ? `v${versionMatch[1]}/` : "";
      thumb = `https://res.cloudinary.com/${cloudName}/video/upload/${THUMB_TRANSFORMS}/${versionPrefix}${publicId}.jpg`;
    }
  }

  if (!thumb && video.includes("res.cloudinary.com")) {
    const publicId = stripVideoExtension(
      cloudinaryPublicIdFromPath(video) ?? "",
    );
    if (publicId) {
      const cloudMatch = video.match(/res\.cloudinary\.com\/([^/]+)/);
      const cloudName = cloudMatch?.[1] ?? "";
      const versionMatch = video.match(/\/v(\d+)\//);
      const versionPrefix = versionMatch ? `v${versionMatch[1]}/` : "";
      thumb = `https://res.cloudinary.com/${cloudName}/video/upload/${THUMB_TRANSFORMS}/${versionPrefix}${publicId}.jpg`;
    }
  }

  return { videoUrl: video, thumbnailUrl: thumb };
}

function cloudinaryPublicIdFromPath(url: string): string | null {
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
    return afterUpload.slice(start).join("/") || null;
  } catch {
    return null;
  }
}

function useCloudinaryUploadProxy(): boolean {
  if (import.meta.env.VITE_CLOUDINARY_DIRECT_UPLOAD === "true") {
    return false;
  }
  if (import.meta.env.DEV) {
    return true;
  }
  if (typeof window === "undefined") {
    return false;
  }
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

function cloudinaryUploadUrl(
  cloudName: string,
  resourceType: "video" | "image",
): string {
  const path = `/v1_1/${cloudName}/${resourceType}/upload`;
  if (useCloudinaryUploadProxy()) {
    return `/cloudinary-upload${path}`;
  }
  return `https://api.cloudinary.com${path}`;
}

export function uploadToCloudinaryWithProgress(
  file: File,
  resourceType: "video" | "image",
  onProgress: (progress: UploadProgress) => void,
): Promise<CloudinaryUploadResult> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string;
  const url = cloudinaryUploadUrl(cloudName, resourceType);

  assertFileWithinLimit(file, resourceType);

  logInfo("Cloudinary upload started", {
    resourceType,
    fileName: file.name,
    fileSize: file.size,
    viaProxy: useCloudinaryUploadProxy(),
    url,
  });

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", uploadPreset);
    form.append("folder", "shortigo-episodes");

    xhr.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable) {
        return;
      }
      onProgress({ loaded: event.loaded, total: event.total });
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(
            xhr.responseText,
          ) as CloudinaryUploadResult;
          logInfo("Cloudinary upload succeeded", {
            resourceType,
            fileName: file.name,
            publicId: result.public_id,
            format: result.format,
            duration: result.duration,
            secureUrl: result.secure_url,
          });
          resolve(result);
        } catch {
          reject(
            new AppError(
              "Cloudinary returned an invalid response (not JSON).",
              "UPLOAD_INVALID_RESPONSE",
              {
                status: xhr.status,
                responsePreview: xhr.responseText.slice(0, 200),
              },
            ),
          );
        }
        return;
      }

      reject(
        buildUploadError({
          status: xhr.status,
          responseText: xhr.responseText,
          fileName: file.name,
          fileSizeBytes: file.size,
          resourceType,
          uploadUrl: url,
        }),
      );
    });

    xhr.addEventListener("error", () => {
      const err = new AppError(
        useCloudinaryUploadProxy()
          ? "Network error while uploading (dev proxy). Restart `npm run dev`, or set VITE_CLOUDINARY_DIRECT_UPLOAD=true and add localhost under Cloudinary Settings → Security → Allowed fetch domains."
          : "Network error while uploading. Add this site under Cloudinary Settings → Security → Allowed fetch domains.",
        "UPLOAD_NETWORK_ERROR",
        { uploadUrl: url, fileName: file.name },
      );
      logError("Cloudinary upload network error", err, { uploadUrl: url });
      reject(err);
    });

    xhr.addEventListener("abort", () => {
      reject(new AppError("Upload cancelled.", "UPLOAD_ABORTED"));
    });

    xhr.open("POST", url);
    xhr.send(form);
  });
}
