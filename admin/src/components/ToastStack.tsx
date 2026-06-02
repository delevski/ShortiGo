import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ToastKind = "error" | "success" | "info";

type ToastItem = {
  id: string;
  kind: ToastKind;
  title: string;
  message: string;
};

type ToastInput = {
  title: string;
  message?: string;
  durationMs?: number;
};

type ToastApi = {
  error: (title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const DEFAULT_DURATION: Record<ToastKind, number> = {
  error: 14000,
  success: 7000,
  info: 6000,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, { title, message = "", durationMs }: ToastInput) => {
      const id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;
      const item: ToastItem = { id, kind, title, message };
      setToasts((current) => [...current, item]);
      window.setTimeout(
        () => dismiss(id),
        durationMs ?? DEFAULT_DURATION[kind],
      );
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      error: (title, message) => push("error", { title, message }),
      success: (title, message) => push("success", { title, message }),
      info: (title, message) => push("info", { title, message }),
      dismiss,
    }),
    [dismiss, push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-relevant="additions">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast toast--${toast.kind}`}
            role={toast.kind === "error" ? "alert" : "status"}
          >
            <div className="toast__body">
              <p className="toast__title">{toast.title}</p>
              {toast.message ? (
                <p className="toast__message">{toast.message}</p>
              ) : null}
            </div>
            <button
              type="button"
              className="toast__close"
              aria-label="Dismiss"
              onClick={() => dismiss(toast.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
