type StatusBannerProps = {
  message: string;
  variant: "idle" | "success" | "error" | "info";
};

export function StatusBanner({ message, variant }: StatusBannerProps) {
  return (
    <div className={`status-banner ${variant}`} role="status">
      {message}
    </div>
  );
}
