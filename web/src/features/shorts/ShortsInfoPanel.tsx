import type { Episode, Series } from "../../domain/types";

type ShortsInfoPanelProps = {
  episode: Episode;
  series: Series;
};

export function ShortsInfoPanel({ episode, series }: ShortsInfoPanelProps) {
  return (
    <div className="shorts-info">
      <span className="shorts-info__eyebrow">EP.{episode.order}</span>
      <h1>{series.title}</h1>
      <p>{series.description}</p>
    </div>
  );
}
