type MediaPreviewProps = {
  videoUrl: string;
  thumbnailUrl: string;
  durationSec: number;
};

export function MediaPreview({
  videoUrl,
  thumbnailUrl,
  durationSec,
}: MediaPreviewProps) {
  if (!videoUrl && !thumbnailUrl) {
    return null;
  }

  return (
    <div className="media-preview">
      <div className="media-preview__player">
        {videoUrl ? (
          <video
            className="media-preview__video"
            src={videoUrl}
            controls
            playsInline
            poster={thumbnailUrl || undefined}
          />
        ) : (
          <div className="media-preview__placeholder">No video yet</div>
        )}
        {durationSec > 0 && (
          <span className="media-preview__duration">{durationSec}s</span>
        )}
      </div>
      <div className="media-preview__meta">
        <p className="media-preview__label">Ready to publish</p>
        <p className="media-preview__hint">9:16 crop applied for mobile fullscreen</p>
        {videoUrl ? (
          <a
            className="media-preview__link"
            href={videoUrl}
            target="_blank"
            rel="noreferrer"
          >
            Open video URL
          </a>
        ) : null}
      </div>
    </div>
  );
}
