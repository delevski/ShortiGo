export function LoadingView({ title = "Loading" }: { title?: string }) {
  return (
    <section className="state-view" aria-live="polite">
      <div className="loading-ring" aria-hidden="true" />
      <h1>{title}</h1>
    </section>
  );
}
