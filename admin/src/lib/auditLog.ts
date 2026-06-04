import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import type { StudioRole } from "./studioAccess";
import { logError } from "./logger";

export type AuditAction =
  | "auth.sign_in"
  | "episode.publish"
  | "episode.replace"
  | "series.create"
  | "series.update"
  | "media.delete"
  | "provider.create"
  | "provider.link_user"
  | "provider.deactivate"
  | "provider.update"
  | "upload.cloudinary.success"
  | "upload.cloudinary.failure";

export type AuditEventInput = {
  action: AuditAction;
  actorUid: string;
  actorEmail?: string | null;
  role: StudioRole;
  providerId?: string | null;
  targetType: string;
  targetId?: string | null;
  seriesId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function writeAuditEvent(input: AuditEventInput): Promise<void> {
  if (!db || !input.actorUid || input.role === "none") {
    return;
  }

  try {
    await addDoc(collection(db, "auditEvents"), {
      action: input.action,
      actorUid: input.actorUid,
      ...(input.actorEmail ? { actorEmail: input.actorEmail } : {}),
      role: input.role,
      ...(input.providerId ? { providerId: input.providerId } : {}),
      targetType: input.targetType,
      ...(input.targetId ? { targetId: input.targetId } : {}),
      ...(input.seriesId ? { seriesId: input.seriesId } : {}),
      metadata: input.metadata ?? {},
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    logError("Failed to write audit event", error, {
      action: input.action,
      targetType: input.targetType,
    });
  }
}
