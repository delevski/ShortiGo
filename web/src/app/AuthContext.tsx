import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import type { Unsubscribe } from "firebase/firestore";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AppUser } from "../domain/types";
import { auth, db, firebaseConfigError } from "../firebase/firebase";
import { ensureUserDoc, watchAppUser } from "../repositories/userRepository";

type AuthContextValue = {
  authUser: User | null;
  appUser: AppUser | null;
  loading: boolean;
  configReady: boolean;
  error: Error | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [configReady, setConfigReady] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!auth || !db || firebaseConfigError) {
      setAuthUser(null);
      setAppUser(null);
      setLoading(false);
      setConfigReady(false);
      return undefined;
    }

    const configuredDb = db;
    let appUserUnsubscribe: Unsubscribe | null = null;
    let isActive = true;
    let authSequence = 0;

    const clearAppUserSubscription = () => {
      if (appUserUnsubscribe) {
        appUserUnsubscribe();
        appUserUnsubscribe = null;
      }
    };

    const authUnsubscribe = onAuthStateChanged(
      auth,
      (nextUser) => {
        const sequence = ++authSequence;
        clearAppUserSubscription();
        setAuthUser(nextUser);
        setAppUser(null);
        setError(null);

        if (!nextUser) {
          setLoading(false);
          return;
        }

        setLoading(true);
        void ensureUserDoc(configuredDb, nextUser)
          .then(() => {
            if (!isActive || sequence !== authSequence) return;
            appUserUnsubscribe = watchAppUser(
              configuredDb,
              nextUser.uid,
              (nextAppUser) => {
                if (!isActive || sequence !== authSequence) return;
                setAppUser(nextAppUser);
                setLoading(false);
              },
              (watchError) => {
                if (!isActive || sequence !== authSequence) return;
                setError(watchError);
                setLoading(false);
              },
            );
          })
          .catch((ensureError: unknown) => {
            if (!isActive || sequence !== authSequence) return;
            setError(ensureError instanceof Error ? ensureError : new Error("Unable to sync user."));
            setLoading(false);
          });
      },
      (authError) => {
        authSequence += 1;
        clearAppUserSubscription();
        setError(authError);
        setAuthUser(null);
        setAppUser(null);
        setLoading(false);
      },
    );

    return () => {
      isActive = false;
      clearAppUserSubscription();
      authUnsubscribe();
    };
  }, []);

  const loginWithGoogle = useCallback(async () => {
    if (!auth) {
      throw new Error("Firebase is not configured.");
    }
    await signInWithPopup(auth, new GoogleAuthProvider());
  }, []);

  const logout = useCallback(async () => {
    if (!auth) return;
    await signOut(auth);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      authUser,
      appUser,
      loading,
      configReady,
      error,
      loginWithGoogle,
      logout,
    }),
    [appUser, authUser, configReady, error, loading, loginWithGoogle, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
}
