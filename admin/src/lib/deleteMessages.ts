import type {
  BulkDeleteResult,
  DeleteEpisodeResult,
  DeleteSeriesResult,
} from "./firestoreCatalog";

function truncateList(items: string[], max = 3): string {
  if (items.length <= max) {
    return items.join(", ");
  }
  return `${items.slice(0, max).join(", ")} +${items.length - max} more`;
}

export function episodeDeleteToastMessage(
  result: DeleteEpisodeResult,
): string {
  const lines = [
    `${result.displayName} (${result.episodeId}) removed from Firestore and Cloudinary.`,
  ];
  if (result.seriesRemoved) {
    lines.push(
      `Series "${result.seriesTitle}" had no episodes left and was removed from the app.`,
    );
  } else {
    lines.push(
      `"${result.seriesTitle}" now has ${result.remainingEpisodeCount} episode(s) in the app.`,
    );
  }
  return lines.join(" ");
}

export function bulkDeleteToastMessage(result: BulkDeleteResult): {
  title: string;
  message: string;
  kind: "success" | "error";
} {
  if (result.deleted === 0 && result.failed.length > 0) {
    return {
      kind: "error",
      title: "Nothing deleted",
      message: `All ${result.failed.length} item(s) failed. First error: ${result.failed[0]?.error ?? "unknown"}`,
    };
  }

  const names = result.deletedEpisodes.map((ep) => ep.displayName);
  const bySeries = new Map<string, number>();
  for (const ep of result.deletedEpisodes) {
    bySeries.set(ep.seriesTitle, (bySeries.get(ep.seriesTitle) ?? 0) + 1);
  }
  const seriesSummary = [...bySeries.entries()]
    .map(([title, count]) => `${title} (${count})`)
    .join(", ");

  const lines = [
    `Removed ${result.deleted} episode(s) from Firestore and Cloudinary.`,
    `Deleted: ${truncateList(names, 4)}.`,
  ];
  if (seriesSummary) {
    lines.push(`By series: ${seriesSummary}.`);
  }
  if (result.removedSeries.length > 0) {
    lines.push(
      `Empty series removed: ${result.removedSeries.map((s) => `"${s.seriesTitle}"`).join(", ")}.`,
    );
  }
  if (result.failed.length > 0) {
    return {
      kind: "error",
      title: "Partial delete",
      message: [
        ...lines,
        `Failed (${result.failed.length}): ${truncateList(result.failed.map((f) => `${f.displayName} — ${f.error}`), 2)}.`,
      ].join(" "),
    };
  }

  return {
    kind: "success",
    title: "Delete complete",
    message: lines.join(" "),
  };
}

export function seriesDeleteToastMessage(result: DeleteSeriesResult): string {
  return [
    `Series "${result.seriesTitle}" (${result.seriesId}) deleted.`,
    `Removed ${result.episodeCount} episode(s) from Firestore and Cloudinary.`,
    "Removed from For You if it was featured.",
  ].join(" ");
}
