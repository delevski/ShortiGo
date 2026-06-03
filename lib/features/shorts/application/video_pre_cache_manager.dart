import '../../../domain/entities/episode.dart';

/// Decides which episodes should keep an active player in the Shorts feed.
class VideoPreCacheManager {
  VideoPreCacheManager({this.windowSize = 3});

  int windowSize;

  /// Episode ids that should mount a player (current + pre-cache window).
  Set<String> keepIdsFor({
    required int currentIndex,
    required List<Episode> episodes,
  }) {
    if (episodes.isEmpty || currentIndex < 0 || currentIndex >= episodes.length) {
      return const {};
    }

    final keepIds = <String>{episodes[currentIndex].id};
    var remaining = windowSize - keepIds.length;
    for (var offset = 1; remaining > 0; offset++) {
      final next = currentIndex + offset;
      if (next < episodes.length) {
        keepIds.add(episodes[next].id);
        remaining--;
      }

      final previous = currentIndex - offset;
      if (remaining > 0 && previous >= 0) {
        keepIds.add(episodes[previous].id);
        remaining--;
      }

      if (next >= episodes.length && previous < 0) {
        break;
      }
    }
    return keepIds;
  }
}
