enum AdUnit { rewarded }

abstract class AdGateway {
  /// Initialize the SDK. Idempotent; safe to call multiple times.
  Future<void> initialize();

  /// Pre-load the next rewarded ad. Idempotent.
  Future<void> preloadRewarded();

  /// Show a rewarded ad. Returns the reward amount on completion, or null
  /// if the user dismissed without earning.
  Future<int?> showRewarded();
}
