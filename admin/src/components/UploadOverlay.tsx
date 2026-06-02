export type OverlayStep = {
  label: string;
  done: boolean;
  active: boolean;
};

type UploadOverlayProps = {
  open: boolean;
  title: string;
  subtitle: string;
  percent: number;
  indeterminate?: boolean;
  steps: OverlayStep[];
};

export function UploadOverlay({
  open,
  title,
  subtitle,
  percent,
  indeterminate = false,
  steps,
}: UploadOverlayProps) {
  if (!open) {
    return null;
  }

  const displayPercent = Math.max(0, Math.min(100, percent));

  return (
    <div className="upload-overlay" role="dialog" aria-modal="true" aria-busy="true">
      <div className="upload-overlay__backdrop" />
      <div className="upload-overlay__panel">
        <div className="upload-overlay__spinner" aria-hidden="true" />
        <p className="upload-overlay__phase">{title}</p>
        {subtitle ? (
          <p className="upload-overlay__file" title={subtitle}>
            {subtitle}
          </p>
        ) : null}

        {indeterminate ? (
          <div className="upload-overlay__bar-track upload-overlay__bar-track--indeterminate">
            <div className="upload-overlay__bar-fill upload-overlay__bar-fill--indeterminate" />
          </div>
        ) : (
          <div className="upload-overlay__bar-track">
            <div
              className="upload-overlay__bar-fill"
              style={{ width: `${displayPercent}%` }}
            />
          </div>
        )}

        <div className="upload-overlay__meta">
          <span>{indeterminate ? "Processing…" : `${displayPercent}%`}</span>
        </div>

        {steps.length > 0 && (
          <ul className="upload-steps">
            {steps.map((step) => (
              <li
                key={step.label}
                className={`upload-steps__item ${step.done ? "upload-steps__item--done" : ""} ${step.active ? "upload-steps__item--active" : ""}`}
              >
                <span className="upload-steps__dot" />
                {step.label}
              </li>
            ))}
          </ul>
        )}

        <p className="upload-overlay__hint">
          Keep this tab open until upload completes.
        </p>
      </div>
    </div>
  );
}
