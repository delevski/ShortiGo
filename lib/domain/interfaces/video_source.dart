/// Abstract source of episode video bytes. Swap FirebaseStorageVideoSource
/// for CloudflareStreamVideoSource without touching callers.
abstract class VideoSource {
  /// Returns a playable URL (with up-to-date auth token if applicable).
  Future<String> playableUrl({
    required String seriesId,
    required String episodeId,
    required String storagePath,
  });
}
