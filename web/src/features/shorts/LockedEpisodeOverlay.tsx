import { Lock, LogIn, Sparkles, Ticket } from "lucide-react";
import type { EpisodeAccess } from "../../shared/access";

type LockedEpisodeOverlayProps = {
  access: EpisodeAccess;
  onLogin: () => void;
  onSubscribe: () => void;
  onUnlock: () => void;
};

export function LockedEpisodeOverlay({
  access,
  onLogin,
  onSubscribe,
  onUnlock,
}: LockedEpisodeOverlayProps) {
  if (access.state === "open") return null;

  const bonusCost = "bonusCost" in access ? access.bonusCost : undefined;
  const title =
    access.state === "login"
      ? "Login to unlock this episode"
      : access.state === "vip"
        ? "VIP episode"
        : "Unlock with bonus coins";
  const message =
    access.state === "login"
      ? "Your account keeps unlocked episodes and rewards synced."
      : access.state === "vip"
        ? bonusCost
          ? `Go VIP or unlock this episode for ${bonusCost} bonus coins.`
          : "Go VIP to keep watching this series."
        : `Use ${bonusCost} bonus coins to keep watching.`;

  return (
    <div className="locked-overlay">
      <div className="locked-overlay__content">
        <Lock aria-hidden="true" size={30} />
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="locked-overlay__actions">
          {access.state === "login" ? (
            <button type="button" onClick={onLogin}>
              <LogIn aria-hidden="true" size={18} />
              <span>Login</span>
            </button>
          ) : null}
          {access.state === "vip" ? (
            <button type="button" onClick={onSubscribe}>
              <Sparkles aria-hidden="true" size={18} />
              <span>Go VIP</span>
            </button>
          ) : null}
          {(access.state === "bonus" || (access.state === "vip" && bonusCost)) ? (
            <button type="button" onClick={onUnlock}>
              <Ticket aria-hidden="true" size={18} />
              <span>{bonusCost ? `Unlock ${bonusCost}` : "Unlock"}</span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
