import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ConfirmOptions = {
  title: string;
  message: string;
  details?: string[];
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
};

type ConfirmRequest = ConfirmOptions & {
  resolve: (confirmed: boolean) => void;
};

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

function ConfirmDialogModal({
  request,
  onClose,
}: {
  request: ConfirmRequest;
  onClose: (confirmed: boolean) => void;
}) {
  const isDanger = request.variant !== "default";
  const confirmLabel = request.confirmLabel ?? (isDanger ? "Delete" : "Confirm");
  const cancelLabel = request.cancelLabel ?? "Cancel";

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="confirm-dialog"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
    >
      <button
        type="button"
        className="confirm-dialog__backdrop"
        aria-label="Cancel"
        onClick={() => onClose(false)}
      />
      <div
        className={`confirm-dialog__panel ${isDanger ? "confirm-dialog__panel--danger" : ""}`}
      >
        <div className="confirm-dialog__icon" aria-hidden="true">
          {isDanger ? "⚠" : "?"}
        </div>
        <h2 id="confirm-dialog-title" className="confirm-dialog__title">
          {request.title}
        </h2>
        <p id="confirm-dialog-desc" className="confirm-dialog__message">
          {request.message}
        </p>
        {request.details && request.details.length > 0 && (
          <ul className="confirm-dialog__details">
            {request.details.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
        <p className="confirm-dialog__warning">This cannot be undone.</p>
        <div className="confirm-dialog__actions">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => onClose(false)}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn ${isDanger ? "btn--danger" : "btn--primary"}`}
            autoFocus
            onClick={() => onClose(true)}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setRequest({ ...options, resolve });
    });
  }, []);

  const value = useMemo(() => ({ confirm }), [confirm]);

  function close(confirmed: boolean) {
    if (!request) {
      return;
    }
    request.resolve(confirmed);
    setRequest(null);
  }

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {request ? (
        <ConfirmDialogModal request={request} onClose={close} />
      ) : null}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within ConfirmProvider");
  }
  return ctx;
}
