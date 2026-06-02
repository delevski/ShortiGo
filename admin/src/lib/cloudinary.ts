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
};

export type UploadProgress = {
  loaded: number;
  total: number;
};

export { formatFileSize } from "./format";

export function cloudinaryConfigError(): string | null {
  if (!import.meta.env.VITE_CLOUDINARY_CLOUD_NAME) {
    return "Missing VITE_CLOUDINARY_CLOUD_NAME";
  }
  if (!import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET) {
    return "Missing VITE_CLOUDINARY_UPLOAD_PRESET";
  }
  return null;
}

export function cloudinaryVideoDeliveryUrl(
  result: CloudinaryUploadResult,
): string {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
  const versionPrefix = result.version ? `v${result.version}/` : "";
  return `https://res.cloudinary.com/${cloudName}/video/upload/c_fill,ar_9:16,g_auto,q_auto/${versionPrefix}${result.public_id}`;
}

export function cloudinaryGeneratedThumbnailUrl(
  result: CloudinaryUploadResult,
): string {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
  const versionPrefix = result.version ? `v${result.version}/` : "";
  return `https://res.cloudinary.com/${cloudName}/image/upload/so_1,c_fill,ar_9:16,g_auto/${versionPrefix}${result.public_id}.jpg`;
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
            duration: result.duration,
          });
          resolve(result);
        } catch {
          reject(
            new AppError(
              "Cloudinary returned an invalid response (not JSON).",
              "UPLOAD_INVALID_RESPONSE",
              { status: xhr.status, responsePreview: xhr.responseText.slice(0, 200) },
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
