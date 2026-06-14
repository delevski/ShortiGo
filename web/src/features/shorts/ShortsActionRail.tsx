import { Bookmark, Heart, Info, Send, UserPlus } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Episode, Series } from "../../domain/types";
import { compactCount } from "../../shared/format";

type ShortsActionRailProps = {
  episode: Episode;
  followed: boolean;
  liked: boolean;
  onFollow: () => void;
  onLike: () => void;
  onSave: () => void;
  onShare: () => void;
  saved: boolean;
  series: Series;
};

export function ShortsActionRail({
  episode,
  followed,
  liked,
  onFollow,
  onLike,
  onSave,
  onShare,
  saved,
  series,
}: ShortsActionRailProps) {
  return (
    <aside className="shorts-action-rail" aria-label="Short actions">
      <button
        className={`shorts-avatar-button${followed ? " shorts-avatar-button--active" : ""}`}
        type="button"
        onClick={onFollow}
        aria-pressed={followed}
        aria-label={followed ? `Unfollow ${series.title}` : `Follow ${series.title}`}
      >
        <img src={series.coverUrl} alt="" />
        <span className="shorts-avatar-button__badge">
          <UserPlus aria-hidden="true" size={14} />
        </span>
      </button>

      <RailButton
        active={liked}
        ariaLabel={liked ? "Unlike episode" : "Like episode"}
        count={episode.likeCount}
        icon={<Heart aria-hidden="true" size={24} fill={liked ? "currentColor" : "none"} />}
        onClick={onLike}
      />

      <Link className="shorts-rail-link" to={`/series/${encodeURIComponent(series.id)}`} aria-label="Series info">
        <Info aria-hidden="true" size={24} />
        <span>Info</span>
      </Link>

      <RailButton
        active={saved}
        ariaLabel={saved ? "Remove saved series" : "Save series"}
        count={series.saveCount}
        icon={<Bookmark aria-hidden="true" size={24} fill={saved ? "currentColor" : "none"} />}
        onClick={onSave}
      />

      <RailButton
        ariaLabel="Share episode"
        count={episode.shareCount}
        icon={<Send aria-hidden="true" size={23} />}
        onClick={onShare}
      />
    </aside>
  );
}

type RailButtonProps = {
  active?: boolean;
  ariaLabel: string;
  count: number;
  icon: ReactNode;
  onClick: () => void;
};

function RailButton({ active = false, ariaLabel, count, icon, onClick }: RailButtonProps) {
  return (
    <button
      className={`shorts-rail-button${active ? " shorts-rail-button--active" : ""}`}
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
    >
      <span className="shorts-rail-button__icon">{icon}</span>
      <span>{compactCount(count)}</span>
    </button>
  );
}
