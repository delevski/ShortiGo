import { Inbox } from "lucide-react";

export function EmptyView({
  title,
  message,
  action,
}: {
  title: string;
  message?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="state-view">
      <Inbox aria-hidden="true" size={30} />
      <h1>{title}</h1>
      {message ? <p>{message}</p> : null}
      {action ? <div className="state-view__action">{action}</div> : null}
    </section>
  );
}
