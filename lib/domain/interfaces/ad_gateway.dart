enum AdUnit { rewarded }

/// Thrown when a rewarded ad cannot be loaded or shown (e.g. no fill on a
/// freshly created production unit, or a network error).
class AdNotAvailableException implements Exception {
  const AdNotAvailableException([this.message = 'No ad available right now.']);

  final String message;

  @override
  String toString() => message;
}

abstract class AdGateway {
  /// Initialize the SDK. Idempotent; safe to call multiple times.
  Future<void> initialize();

  /// Pre-load the next rewarded ad. Idempotent.
  Future<void> preloadRewarded();

  /// Show a rewarded ad, loading one first if none is cached.
  ///
  /// Returns the reward amount on completion, or null if the user dismissed
  /// without earning. Throws [AdNotAvailableException] when no ad can be
  /// loaded or shown.
  Future<int?> showRewarded();
}
