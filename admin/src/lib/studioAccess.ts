import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export type StudioRole = "superAdmin" | "provider" | "none";

export type StudioAccess = {
  role: StudioRole;
  providerId: string | null;
  displayName: string | null;
  email: string | null;
  active: boolean;
  canPublish: boolean;
  canDelete: boolean;
  canManageProviders: boolean;
  canViewAudit: boolean;
  canWriteFeatured: boolean;
};

const NO_ACCESS: StudioAccess = {
  role: "none",
  providerId: null,
  displayName: null,
  email: null,
  active: false,
  canPublish: false,
  canDelete: false,
  canManageProviders: false,
  canViewAudit: false,
  canWriteFeatured: false,
};

export async function loadStudioAccess(uid: string): Promise<StudioAccess> {
  if (!db || !uid) {
    return NO_ACCESS;
  }

  const snap = await getDoc(doc(db, "adminUsers", uid));
  if (!snap.exists()) {
    return NO_ACCESS;
  }

  const data = snap.data();
  const active = data.active !== false;
  const rawRole = typeof data.role === "string" ? data.role : "";
  const role: StudioRole = rawRole === "provider" ? "provider" : "superAdmin";
  const providerId =
    typeof data.providerId === "string" && data.providerId.trim()
      ? data.providerId.trim()
      : null;
  const displayName =
    typeof data.displayName === "string" ? data.displayName : null;
  const email = typeof data.email === "string" ? data.email : null;

  const isSuperAdmin = role === "superAdmin";
  const isProvider = role === "provider" && !!providerId;

  if (!active) {
    return {
      ...NO_ACCESS,
      role,
      providerId,
      displayName,
      email,
      active: false,
    };
  }

  if (isSuperAdmin) {
    return {
      role: "superAdmin",
      providerId: null,
      displayName,
      email,
      active: true,
      canPublish: true,
      canDelete: true,
      canManageProviders: true,
      canViewAudit: true,
      canWriteFeatured: true,
    };
  }

  if (isProvider) {
    return {
      role: "provider",
      providerId,
      displayName,
      email,
      active: true,
      canPublish: true,
      canDelete: false,
      canManageProviders: false,
      canViewAudit: false,
      canWriteFeatured: false,
    };
  }

  return NO_ACCESS;
}

export function providerPrefixedSeriesId(
  providerId: string,
  slug: string,
): string {
  const base = slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  if (!base) {
    return providerId;
  }
  if (base.startsWith(`${providerId}_`)) {
    return base;
  }
  return `${providerId}_${base}`;
}
