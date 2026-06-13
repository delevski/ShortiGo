import { AlertTriangle } from "lucide-react";

export function ErrorView({
  title = "Something went wrong",
  message,
  action,
}: {
  title?: string;
  message?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="state-view state-view--error" role="alert">
      <AlertTriangle aria-hidden="true" size={30} />
      <h1>{title}</h1>
      {message ? <p>{message}</p> : null}
      {action ? <div className="state-view__action">{action}</div> : null}
    </section>
  );
}
