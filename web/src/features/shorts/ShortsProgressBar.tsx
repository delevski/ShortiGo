type ShortsProgressBarProps = {
  progress: number;
};

export function ShortsProgressBar({ progress }: ShortsProgressBarProps) {
  const clamped = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));

  return (
    <div className="shorts-progress" aria-hidden="true">
      <span style={{ width: `${clamped * 100}%` }} />
    </div>
  );
}
