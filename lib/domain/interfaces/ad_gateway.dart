enum AdUnit { rewarded }

enum AdPhase {
  initializing,
  loading,
  ready,
  showing,
  rewardPending,
  noFill,
  networkError,
  invalidConfiguration,
  unavailable,
}

class AdStatus {
  const AdStatus({
    required this.phase,
    this.message,
    this.errorCode,
    this.isTestAd = false,
  });

  const AdStatus.loading({bool isTestAd = false})
      : this(phase: AdPhase.loading, isTestAd: isTestAd);

  const AdStatus.ready({bool isTestAd = false})
      : this(phase: AdPhase.ready, isTestAd: isTestAd);

  final AdPhase phase;
  final String? message;
  final int? errorCode;
  final bool isTestAd;

  bool get canShow => phase == AdPhase.ready;
}

/// Thrown when a rewarded ad cannot be loaded or shown (e.g. no fill on a
/// freshly created production unit, or a network error).
class AdNotAvailableException implements Exception {
  const AdNotAvailableException([this.message = 'No ad available right now.']);

  final String message;

  @override
  String toString() => message;
}

abstract class AdGateway {
  Stream<AdStatus> get status;
  AdStatus get currentStatus;

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

  Future<void> openAdInspector();
}
