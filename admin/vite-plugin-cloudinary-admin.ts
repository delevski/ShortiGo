import type { Connect, Plugin } from "vite";
import { v2 as cloudinary } from "cloudinary";
import { verifyStudioSuperAdmin } from "./vite-verify-studio-token";

type DeleteBody = {
  assets?: { publicId: string; resourceType: "video" | "image" }[];
};

function readJsonBody(req: Connect.IncomingMessage): Promise<DeleteBody> {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      try {
        resolve(raw ? (JSON.parse(raw) as DeleteBody) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function sendJson(
  res: Connect.ServerResponse,
  status: number,
  payload: Record<string, unknown>,
): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

function readBearerToken(req: Connect.IncomingMessage): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return null;
  }
  return header.slice(7).trim() || null;
}

function createDeleteHandler(env: Record<string, string>) {
  const cloudName =
    env.CLOUDINARY_CLOUD_NAME || env.VITE_CLOUDINARY_CLOUD_NAME || "";
  const apiKey = env.CLOUDINARY_API_KEY || "";
  const apiSecret = env.CLOUDINARY_API_SECRET || "";
  const projectId = env.VITE_FIREBASE_PROJECT_ID || "";

  return async (
    req: Connect.IncomingMessage,
    res: Connect.ServerResponse,
    next: () => void,
  ) => {
    if (req.url !== "/api/cloudinary/delete" || req.method !== "POST") {
      next();
      return;
    }

    if (!cloudName || !apiKey || !apiSecret) {
      sendJson(res, 503, {
        error:
          "Cloudinary admin API not configured. Add CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to admin/.env (Dashboard → API Keys).",
      });
      return;
    }

    try {
      const token = readBearerToken(req);
      if (!token) {
        sendJson(res, 401, {
          error: "Sign in required. Send Authorization: Bearer <Firebase ID token>.",
        });
        return;
      }
      if (!projectId) {
        sendJson(res, 503, {
          error: "VITE_FIREBASE_PROJECT_ID is required to verify delete permissions.",
        });
        return;
      }
      const allowed = await verifyStudioSuperAdmin(token, projectId);
      if (!allowed) {
        sendJson(res, 403, {
          error: "Only super-admin accounts may delete Cloudinary assets.",
        });
        return;
      }

      const body = await readJsonBody(req);
      const assets = body.assets ?? [];
      if (assets.length === 0) {
        sendJson(res, 400, { error: "No assets to delete." });
        return;
      }

      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });

      const results: {
        publicId: string;
        resourceType: string;
        result: string;
      }[] = [];

      for (const asset of assets) {
        const response = await cloudinary.uploader.destroy(asset.publicId, {
          resource_type: asset.resourceType,
          invalidate: true,
        });
        results.push({
          publicId: asset.publicId,
          resourceType: asset.resourceType,
          result: response.result ?? "unknown",
        });
      }

      sendJson(res, 200, { ok: true, results });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      sendJson(res, 500, { error: message });
    }
  };
}

export function cloudinaryAdminApi(env: Record<string, string>): Plugin {
  const handler = createDeleteHandler(env);
  return {
    name: "cloudinary-admin-api",
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}
