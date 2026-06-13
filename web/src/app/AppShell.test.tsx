import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "./AppShell";
import { AuthProvider } from "./AuthContext";
import { ToastProvider } from "../components/Toast";

type AuthCallback = (user: { uid: string; displayName: string | null } | null) => void;
type WatchAppUser = (
  db: unknown,
  uid: string,
  onNext: (user: unknown) => void,
  onError: (error: Error) => void,
) => () => void;

const authMocks = vi.hoisted(() => ({
  authCallback: undefined as AuthCallback | undefined,
  authUnsubscribe: vi.fn(),
  ensureResolvers: [] as Array<() => void>,
  ensureUserDoc: vi.fn(
    () =>
      new Promise<void>((resolve) => {
        authMocks.ensureResolvers.push(resolve);
      }),
  ),
  watchAppUser: vi.fn<WatchAppUser>(() => vi.fn()),
}));

vi.mock("firebase/auth", () => ({
  GoogleAuthProvider: vi.fn(),
  onAuthStateChanged: vi.fn((_auth, callback: AuthCallback) => {
    authMocks.authCallback = callback;
    return authMocks.authUnsubscribe;
  }),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("../firebase/firebase", () => ({
  auth: { app: "test-auth" },
  db: { app: "test-db" },
  firebaseConfigError: undefined,
}));

vi.mock("../repositories/userRepository", () => ({
  ensureUserDoc: authMocks.ensureUserDoc,
  watchAppUser: authMocks.watchAppUser,
}));

describe("AppShell", () => {
  beforeEach(() => {
    authMocks.authCallback = undefined;
    authMocks.authUnsubscribe.mockClear();
    authMocks.ensureResolvers.length = 0;
    authMocks.ensureUserDoc.mockClear();
    authMocks.watchAppUser.mockClear();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it("renders the ShortiGo shell navigation and child content", () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <ToastProvider>
            <AppShell>
              <h1>Feed preview</h1>
            </AppShell>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(screen.getAllByRole("link", { name: /ShortiGo/i })).not.toHaveLength(0);
    expect(screen.getAllByRole("link", { name: /For You/i })).not.toHaveLength(0);
    expect(screen.getAllByRole("link", { name: /Explore/i })).not.toHaveLength(0);
    expect(screen.getByRole("heading", { name: /Feed preview/i })).toBeTruthy();
  });

  it("does not attach a stale app-user listener when auth changes during user sync", async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <ToastProvider>
            <AppShell>
              <h1>Feed preview</h1>
            </AppShell>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    authMocks.authCallback?.({ uid: "first-user", displayName: "First" });
    authMocks.authCallback?.({ uid: "second-user", displayName: "Second" });

    authMocks.ensureResolvers[0]?.();
    await Promise.resolve();

    expect(authMocks.watchAppUser).not.toHaveBeenCalled();

    authMocks.ensureResolvers[1]?.();
    await Promise.resolve();

    expect(authMocks.watchAppUser).toHaveBeenCalledTimes(1);
    expect(authMocks.watchAppUser.mock.calls[0][1]).toBe("second-user");
  });
});
