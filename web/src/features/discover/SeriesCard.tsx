import { Crown, Play } from "lucide-react";
import { Link } from "react-router-dom";
import type { Series } from "../../domain/types";
import { compactCount } from "../../shared/format";

const coverFallback = "/branding/splash_hero.png";

export function SeriesCard({ series }: { series: Series }) {
  return (
    <Link className="series-card" to={`/series/${series.id}`} aria-label={`${series.title} series`}>
      <div className="series-card__cover">
        <img
          src={series.coverUrl || coverFallback}
          alt=""
          loading="lazy"
          onError={(event) => {
            event.currentTarget.src = coverFallback;
          }}
        />
        {series.isVip ? (
          <span className="vip-chip series-card__vip">
            <Crown aria-hidden="true" size={13} />
            VIP
          </span>
        ) : null}
        <span className="series-card__play" aria-hidden="true">
          <Play size={18} fill="currentColor" />
        </span>
      </div>
      <div className="series-card__body">
        <h2>{series.title}</h2>
        <p>
          {series.episodeCount} {series.episodeCount === 1 ? "episode" : "episodes"} ·{" "}
          {compactCount(series.followerCount)} followers
        </p>
      </div>
    </Link>
  );
}
