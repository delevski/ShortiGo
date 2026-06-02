import { AppError } from "./appError";
import { formatFileSize } from "./format";

export type UploadErrorContext = {
  status: number;
  responseText: string;
  fileName: string;
  fileSizeBytes: number;
  resourceType: "video" | "image";
  uploadUrl: string;
};

function parseCloudinaryJsonMessage(responseText: string): string | null {
  try {
    const body = JSON.parse(responseText) as {
      error?: { message?: string };
    };
    if (body.error?.message) {
      return body.error.message;
    }
  } catch {
    // not JSON
  }
  return null;
}

function parseHtmlTitle(responseText: string): string | null {
  const match = responseText.match(/<title>\s*([^<]+?)\s*<\/title>/i);
  return match?.[1]?.trim() ?? null;
}

export function buildUploadError(context: UploadErrorContext): AppError {
  const sizeLabel = formatFileSize(context.fileSizeBytes);
  const cloudinaryMessage = parseCloudinaryJsonMessage(context.responseText);
  const htmlTitle = parseHtmlTitle(context.responseText);

  logUploadFailure(context, cloudinaryMessage, htmlTitle);

  if (context.status === 413) {
    return new AppError(
      `Video/file is too large (${sizeLabel}). Cloudinary rejected the upload. Compress "${context.fileName}" or raise the max file size on upload preset in Cloudinary Console → Upload presets.`,
      "UPLOAD_TOO_LARGE",
      { ...context, sizeLabel },
    );
  }

  if (context.status === 401 || context.status === 403) {
    return new AppError(
      `Cloudinary rejected the upload (HTTP ${context.status}). Check cloud name, upload preset name, and that the preset is unsigned.`,
      "UPLOAD_UNAUTHORIZED",
      context,
    );
  }

  if (cloudinaryMessage) {
    return new AppError(
      `Cloudinary: ${cloudinaryMessage}`,
      "UPLOAD_CLOUDINARY_ERROR",
      context,
    );
  }

  if (htmlTitle) {
    const friendly =
      htmlTitle === "413 Request Entity Too Large"
        ? `File too large (${sizeLabel})`
        : htmlTitle;
    return new AppError(
      `Upload failed (HTTP ${context.status}): ${friendly}`,
      "UPLOAD_HTTP_ERROR",
      context,
    );
  }

  const snippet = context.responseText.replace(/\s+/g, " ").trim().slice(0, 160);
  return new AppError(
    snippet
      ? `Upload failed (HTTP ${context.status}): ${snippet}`
      : `Upload failed with HTTP ${context.status}.`,
    "UPLOAD_HTTP_ERROR",
    context,
  );
}

function logUploadFailure(
  context: UploadErrorContext,
  cloudinaryMessage: string | null,
  htmlTitle: string | null,
): void {
  console.error("[ShortiGo Studio] Cloudinary upload failed", {
    status: context.status,
    resourceType: context.resourceType,
    fileName: context.fileName,
    fileSize: formatFileSize(context.fileSizeBytes),
    uploadUrl: context.uploadUrl,
    cloudinaryMessage,
    htmlTitle,
    responsePreview: context.responseText.slice(0, 500),
  });
}

export function assertFileWithinLimit(
  file: File,
  resourceType: "video" | "image",
): void {
  const envKey =
    resourceType === "video"
      ? "VITE_CLOUDINARY_MAX_VIDEO_MB"
      : "VITE_CLOUDINARY_MAX_IMAGE_MB";
  const defaultMb = resourceType === "video" ? 100 : 10;
  const maxMb = Number(import.meta.env[envKey] ?? defaultMb);
  const maxBytes = maxMb * 1024 * 1024;

  if (file.size <= maxBytes) {
    return;
  }

  throw new AppError(
    `"${file.name}" is ${formatFileSize(file.size)} — over the ${maxMb} MB limit for ${resourceType} uploads. Compress the file or increase ${envKey} (and your Cloudinary upload preset max size).`,
    "FILE_TOO_LARGE_LOCAL",
    {
      fileName: file.name,
      fileSizeBytes: file.size,
      maxBytes,
      resourceType,
    },
  );
}
