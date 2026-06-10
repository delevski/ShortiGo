import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

export type ProviderRecord = {
  id: string;
  name: string;
  active: boolean;
  notes?: string;
};

export type LinkedStudioUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  active: boolean;
  providerId: string;
};

export async function fetchProviders(): Promise<ProviderRecord[]> {
  if (!db) {
    return [];
  }
  const snap = await getDocs(collection(db, "providers"));
  const rows: ProviderRecord[] = snap.docs.map((item) => {
    const data = item.data();
    return {
      id: item.id,
      name: typeof data.name === "string" ? data.name : item.id,
      active: data.active !== false,
      notes: typeof data.notes === "string" ? data.notes : undefined,
    };
  });
  rows.sort((a, b) => a.name.localeCompare(b.name));
  return rows;
}

/** Single query for all provider-linked studio users (group in UI by providerId). */
export async function fetchAllLinkedProviderUsers(): Promise<
  LinkedStudioUser[]
> {
  if (!db) {
    return [];
  }
  const snap = await getDocs(
    query(collection(db, "adminUsers"), where("role", "==", "provider")),
  );
  return snap.docs
    .map((item) => {
      const data = item.data();
      const providerId =
        typeof data.providerId === "string" ? data.providerId : "";
      if (!providerId) {
        return null;
      }
      return {
        uid: item.id,
        email: typeof data.email === "string" ? data.email : null,
        displayName:
          typeof data.displayName === "string" ? data.displayName : null,
        active: data.active !== false,
        providerId,
      };
    })
    .filter((row): row is LinkedStudioUser => row !== null);
}

export async function fetchLinkedUsersForProvider(
  providerId: string,
): Promise<LinkedStudioUser[]> {
  if (!db) {
    return [];
  }
  const snap = await getDocs(
    query(
      collection(db, "adminUsers"),
      where("providerId", "==", providerId),
      where("role", "==", "provider"),
    ),
  );
  return snap.docs.map((item) => {
    const data = item.data();
    return {
      uid: item.id,
      email: typeof data.email === "string" ? data.email : null,
      displayName:
        typeof data.displayName === "string" ? data.displayName : null,
      active: data.active !== false,
      providerId,
    };
  });
}

export async function createProvider(
  providerId: string,
  name: string,
  notes?: string,
): Promise<void> {
  if (!db) {
    throw new Error("Firestore is not ready.");
  }
  const id = providerId.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_");
  if (!id) {
    throw new Error("Provider ID is required.");
  }
  await setDoc(doc(db, "providers", id), {
    id,
    name: name.trim() || id,
    active: true,
    notes: notes?.trim() ?? "",
    createdAt: serverTimestamp(),
  });
}

export async function setProviderActive(
  providerId: string,
  name: string,
  active: boolean,
  notes?: string,
): Promise<void> {
  if (!db) {
    throw new Error("Firestore is not ready.");
  }
  await setDoc(
    doc(db, "providers", providerId),
    {
      id: providerId,
      name: name.trim() || providerId,
      active,
      notes: notes?.trim() ?? "",
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function linkProviderUser(input: {
  uid: string;
  providerId: string;
  email?: string | null;
  displayName?: string | null;
}): Promise<void> {
  if (!db) {
    throw new Error("Firestore is not ready.");
  }
  const uid = input.uid.trim();
  if (!uid) {
    throw new Error("Firebase UID is required.");
  }
  const payload: Record<string, unknown> = {
    role: "provider",
    providerId: input.providerId,
    active: true,
    createdAt: serverTimestamp(),
  };
  if (input.email?.trim()) {
    payload.email = input.email.trim();
  }
  if (input.displayName?.trim()) {
    payload.displayName = input.displayName.trim();
  }
  await setDoc(doc(db, "adminUsers", uid), payload);
}

export async function setLinkedUserActive(
  uid: string,
  providerId: string,
  active: boolean,
  email?: string | null,
  displayName?: string | null,
): Promise<void> {
  if (!db) {
    throw new Error("Firestore is not ready.");
  }
  const payload: Record<string, unknown> = {
    role: "provider",
    providerId,
    active,
    updatedAt: serverTimestamp(),
  };
  if (email?.trim()) {
    payload.email = email.trim();
  }
  if (displayName?.trim()) {
    payload.displayName = displayName.trim();
  }
  await setDoc(doc(db, "adminUsers", uid), payload, { merge: true });
}
