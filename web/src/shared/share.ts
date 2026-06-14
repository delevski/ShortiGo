type EpisodeShareUrlInput = {
  origin: string;
  seriesId: string;
  episodeId: string;
  route?: "episode" | "shorts";
};

type EpisodeShareTextInput = EpisodeShareUrlInput & {
  seriesTitle: string;
  episodeOrder: number;
};

export function episodeShareUrl({
  origin,
  seriesId,
  episodeId,
  route = "episode",
}: EpisodeShareUrlInput): string {
  const base = origin.replace(/\/+$/, "");
  if (route === "shorts") {
    const params = new URLSearchParams({ series: seriesId, episode: episodeId });
    return `${base}/shorts?${params.toString()}`;
  }
  return `${base}/series/${encodeURIComponent(seriesId)}/episodes/${encodeURIComponent(episodeId)}`;
}

export function episodeShareText(input: EpisodeShareTextInput): string {
  return `Watch ${input.seriesTitle} EP.${input.episodeOrder} on ShortiGo: ${episodeShareUrl(input)}`;
}
