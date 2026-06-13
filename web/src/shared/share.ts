type EpisodeShareUrlInput = {
  origin: string;
  seriesId: string;
  episodeId: string;
};

type EpisodeShareTextInput = EpisodeShareUrlInput & {
  seriesTitle: string;
  episodeOrder: number;
};

export function episodeShareUrl({ origin, seriesId, episodeId }: EpisodeShareUrlInput): string {
  const base = origin.replace(/\/+$/, "");
  return `${base}/series/${encodeURIComponent(seriesId)}/episodes/${encodeURIComponent(episodeId)}`;
}

export function episodeShareText(input: EpisodeShareTextInput): string {
  return `Watch ${input.seriesTitle} EP.${input.episodeOrder} on ShortiGo: ${episodeShareUrl(input)}`;
}
