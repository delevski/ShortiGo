import { useCallback, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { writeAuditEvent } from "../lib/auditLog";
import { logError } from "../lib/logger";
import {
  createProvider,
  fetchLinkedUsersForProvider,
  fetchProviders,
  linkProviderUser,
  setLinkedUserActive,
  setProviderActive,
  type LinkedStudioUser,
  type ProviderRecord,
} from "../lib/providersFirestore";
import type { StudioAccess } from "../lib/studioAccess";
import { useToast } from "./ToastStack";

type ProvidersAdminProps = {
  user: User;
  studioAccess: StudioAccess;
};

export function ProvidersAdmin({ user, studioAccess }: ProvidersAdminProps) {
  const toast = useToast();
  const [providers, setProviders] = useState<ProviderRecord[]>([]);
  const [linkedByProvider, setLinkedByProvider] = useState<
    Record<string, LinkedStudioUser[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [newProviderId, setNewProviderId] = useState("");
  const [newProviderName, setNewProviderName] = useState("");
  const [linkProviderId, setLinkProviderId] = useState("");
  const [linkUid, setLinkUid] = useState("");
  const [linkEmail, setLinkEmail] = useState("");
  const [linkDisplayName, setLinkDisplayName] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchProviders();
      setProviders(rows);
      const linked: Record<string, LinkedStudioUser[]> = {};
      await Promise.all(
        rows.map(async (provider) => {
          linked[provider.id] = await fetchLinkedUsersForProvider(provider.id);
        }),
      );
      setLinkedByProvider(linked);
    } catch (error) {
      logError("Failed to load providers", error);
      toast.error("Load failed", String(error));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreateProvider() {
    try {
      await createProvider(newProviderId, newProviderName);
      await writeAuditEvent({
        action: "provider.create",
        actorUid: user.uid,
        actorEmail: user.email,
        role: studioAccess.role,
        providerId: newProviderId.trim().toLowerCase(),
        targetType: "provider",
        targetId: newProviderId.trim().toLowerCase(),
        metadata: { name: newProviderName },
      });
      toast.success("Provider created", newProviderName || newProviderId);
      setNewProviderId("");
      setNewProviderName("");
      await load();
    } catch (error) {
      toast.error("Create failed", String(error));
    }
  }

  async function handleLinkUser() {
    try {
      await linkProviderUser({
        uid: linkUid,
        providerId: linkProviderId,
        email: linkEmail || null,
        displayName: linkDisplayName || null,
      });
      await writeAuditEvent({
        action: "provider.link_user",
        actorUid: user.uid,
        actorEmail: user.email,
        role: studioAccess.role,
        providerId: linkProviderId,
        targetType: "adminUser",
        targetId: linkUid,
        metadata: { email: linkEmail, displayName: linkDisplayName },
      });
      toast.success("User linked", `UID ${linkUid} → ${linkProviderId}`);
      setLinkUid("");
      setLinkEmail("");
      setLinkDisplayName("");
      await load();
    } catch (error) {
      toast.error("Link failed", String(error));
    }
  }

  return (
    <div className="providers-admin">
      <section className="card">
        <h2 className="section-title">Providers</h2>
        <p className="hint">
          Create a provider org, then link a Firebase Auth UID (Google sign-in).
          Providers upload to their own series (<code>providerId_slug</code>) and
          cannot delete content.
        </p>
        <p className="hint">
          Your super-admin UID: <code>{user.uid}</code>
        </p>
      </section>

      <section className="card">
        <h3 className="section-title">Create provider</h3>
        <div className="field-grid">
          <label className="field">
            <span className="field__label">Provider ID (slug)</span>
            <input
              value={newProviderId}
              onChange={(e) => setNewProviderId(e.target.value)}
              placeholder="acme_studios"
            />
          </label>
          <label className="field">
            <span className="field__label">Display name</span>
            <input
              value={newProviderName}
              onChange={(e) => setNewProviderName(e.target.value)}
              placeholder="Acme Studios"
            />
          </label>
        </div>
        <button
          type="button"
          className="btn btn--primary"
          disabled={!newProviderId.trim()}
          onClick={() => void handleCreateProvider()}
        >
          Create provider
        </button>
      </section>

      <section className="card">
        <h3 className="section-title">Link Google user</h3>
        <p className="hint">
          Ask the provider to sign in once and copy their UID from the auth card
          (or Firebase Console → Authentication).
        </p>
        <div className="field-grid">
          <label className="field">
            <span className="field__label">Provider</span>
            <select
              value={linkProviderId}
              onChange={(e) => setLinkProviderId(e.target.value)}
            >
              <option value="">Select provider</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.id})
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field__label">Firebase UID</span>
            <input
              value={linkUid}
              onChange={(e) => setLinkUid(e.target.value)}
              placeholder="IbBrfyxmc5aCYp0vgiGhxkTqTzd2"
            />
          </label>
          <label className="field">
            <span className="field__label">Email (optional)</span>
            <input
              value={linkEmail}
              onChange={(e) => setLinkEmail(e.target.value)}
              placeholder="partner@example.com"
            />
          </label>
          <label className="field">
            <span className="field__label">Display name (optional)</span>
            <input
              value={linkDisplayName}
              onChange={(e) => setLinkDisplayName(e.target.value)}
            />
          </label>
        </div>
        <button
          type="button"
          className="btn btn--primary"
          disabled={!linkProviderId || !linkUid.trim()}
          onClick={() => void handleLinkUser()}
        >
          Link user to provider
        </button>
      </section>

      <section className="card">
        <div className="library__header">
          <h3 className="section-title">Registered providers</h3>
          <button
            type="button"
            className="btn btn--ghost"
            disabled={loading}
            onClick={() => void load()}
          >
            Refresh
          </button>
        </div>
        {loading ? (
          <p className="hint">Loading…</p>
        ) : providers.length === 0 ? (
          <p className="hint">No providers yet.</p>
        ) : (
          <ul className="providers-list">
            {providers.map((provider) => (
              <li key={provider.id} className="providers-list__item">
                <div className="providers-list__head">
                  <strong>{provider.name}</strong>
                  <code>{provider.id}</code>
                  <span
                    className={`badge ${provider.active ? "" : "badge--warn"}`}
                  >
                    {provider.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="providers-list__actions">
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() =>
                      void setProviderActive(
                        provider.id,
                        provider.name,
                        !provider.active,
                        provider.notes,
                      ).then(() => load())
                    }
                  >
                    {provider.active ? "Deactivate org" : "Activate org"}
                  </button>
                </div>
                <div className="providers-list__users">
                  <p className="hint">Linked accounts</p>
                  {(linkedByProvider[provider.id] ?? []).length === 0 ? (
                    <p className="hint">None linked.</p>
                  ) : (
                    <ul>
                      {(linkedByProvider[provider.id] ?? []).map((linked) => (
                        <li key={linked.uid}>
                          <code>{linked.uid}</code>
                          {linked.email ? ` · ${linked.email}` : ""}
                          <span
                            className={`badge ${linked.active ? "" : "badge--warn"}`}
                          >
                            {linked.active ? "Active" : "Inactive"}
                          </span>
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={() => {
                              const nextActive = !linked.active;
                              void setLinkedUserActive(
                                linked.uid,
                                provider.id,
                                nextActive,
                                linked.email,
                                linked.displayName,
                              )
                                .then(async () => {
                                  if (!nextActive) {
                                    await writeAuditEvent({
                                      action: "provider.deactivate",
                                      actorUid: user.uid,
                                      actorEmail: user.email,
                                      role: studioAccess.role,
                                      providerId: provider.id,
                                      targetType: "adminUser",
                                      targetId: linked.uid,
                                    });
                                  }
                                  return load();
                                })
                                .catch((error) =>
                                  toast.error("Update failed", String(error)),
                                );
                            }}
                          >
                            {linked.active ? "Deactivate" : "Activate"}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
