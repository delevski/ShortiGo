export function compactCount(value: number): string {
  const abs = Math.abs(value);
  if (abs < 1_000) return String(value);
  if (abs < 1_000_000) {
    const roundedThousands = Math.round((value / 1_000) * 10) / 10;
    if (Math.abs(roundedThousands) < 1_000) return formatCompact(roundedThousands, "K");
  }
  return trimCompact(value / 1_000_000, "M");
}

function trimCompact(value: number, suffix: string): string {
  const rounded = Math.round(value * 10) / 10;
  return formatCompact(rounded, suffix);
}

function formatCompact(value: number, suffix: string): string {
  return `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)}${suffix}`;
}

export function durationLabel(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const mm = hours > 0 ? String(minutes).padStart(2, "0") : String(minutes);
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}
