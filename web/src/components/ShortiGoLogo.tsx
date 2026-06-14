export function ShortiGoLogo({ size = 40 }: { size?: number }) {
  return (
    <span className="shortigo-logo" style={{ width: size, height: size }}>
      <img src="/branding/shortigo_app_icon.png" alt="" />
    </span>
  );
}
