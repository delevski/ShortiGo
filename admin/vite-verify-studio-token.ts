import { createRemoteJWKSet, jwtVerify } from "jose";

const JWKS = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
  ),
);

export async function verifyStudioSuperAdmin(
  bearerToken: string,
  projectId: string,
): Promise<boolean> {
  if (!bearerToken || !projectId) {
    return false;
  }

  try {
    const { payload } = await jwtVerify(bearerToken, JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });
    const uid = payload.sub;
    if (!uid || typeof uid !== "string") {
      return false;
    }

    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/adminUsers/${uid}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${bearerToken}` },
    });
    if (!response.ok) {
      return false;
    }

    const doc = (await response.json()) as {
      fields?: {
        role?: { stringValue?: string };
        active?: { booleanValue?: boolean };
      };
    };
    const role = doc.fields?.role?.stringValue;
    const active = doc.fields?.active?.booleanValue !== false;
    if (!active) {
      return false;
    }
    return !role || role === "superAdmin";
  } catch {
    return false;
  }
}
