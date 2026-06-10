import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';

import '../../core/env/env.dart';
import '../../domain/interfaces/ad_gateway.dart';

class AdmobAdGateway implements AdGateway {
  bool _initialized = false;
  RewardedAd? _rewarded;
  final _statusController = StreamController<AdStatus>.broadcast();
  AdStatus _status = const AdStatus(
    phase: AdPhase.initializing,
  );

  bool get _isTestAd => !env.isProd;

  @override
  Stream<AdStatus> get status => _statusController.stream;

  @override
  AdStatus get currentStatus => _status;

  void _emit(AdStatus status) {
    _status = status;
    _statusController.add(status);
  }

  String get _unitId {
    if (defaultTargetPlatform == TargetPlatform.iOS &&
        env.adMobRewardedUnitIdIos.isNotEmpty) {
      return env.adMobRewardedUnitIdIos;
    }
    return env.adMobRewardedUnitIdAndroid;
  }

  @override
  Future<void> initialize() async {
    if (_initialized) {
      return;
    }

    _emit(AdStatus(phase: AdPhase.initializing, isTestAd: _isTestAd));
    try {
      await _requestConsent();
      await MobileAds.instance.initialize();
      _initialized = true;
      _emit(AdStatus.loading(isTestAd: _isTestAd));
    } catch (error) {
      _emit(
        AdStatus(
          phase: AdPhase.invalidConfiguration,
          message: error.toString(),
          isTestAd: _isTestAd,
        ),
      );
      rethrow;
    }
  }

  Future<void> _requestConsent() async {
    final completer = Completer<void>();
    ConsentInformation.instance.requestConsentInfoUpdate(
      ConsentRequestParameters(),
      () async {
        await ConsentForm.loadAndShowConsentFormIfRequired((_) {});
        if (!completer.isCompleted) {
          completer.complete();
        }
      },
      (_) {
        if (!completer.isCompleted) {
          completer.complete();
        }
      },
    );
    await completer.future;
  }

  @override
  Future<void> preloadRewarded() async {
    if (!_initialized) {
      await initialize();
    }
    if (_rewarded != null) {
      _emit(AdStatus.ready(isTestAd: _isTestAd));
      return;
    }

    _emit(AdStatus.loading(isTestAd: _isTestAd));
    final completer = Completer<RewardedAd?>();
    await RewardedAd.load(
      adUnitId: _unitId,
      request: const AdRequest(),
      rewardedAdLoadCallback: RewardedAdLoadCallback(
        onAdLoaded: (ad) {
          _rewarded = ad;
          _emit(AdStatus.ready(isTestAd: _isTestAd));
          if (!completer.isCompleted) {
            completer.complete(ad);
          }
        },
        onAdFailedToLoad: (error) {
          _rewarded = null;
          _emit(
            AdStatus(
              phase: _phaseForLoadError(error),
              message: error.message,
              errorCode: error.code,
              isTestAd: _isTestAd,
            ),
          );
          if (kDebugMode) {
            debugPrint('Rewarded ad failed to load: $error');
          }
          if (!completer.isCompleted) {
            completer.complete(null);
          }
        },
      ),
    );

    await completer.future;
  }

  @override
  Future<int?> showRewarded() async {
    if (!_initialized) {
      await initialize();
    }

    // Load on demand if nothing is cached so the first tap still shows an ad.
    if (_rewarded == null) {
      await preloadRewarded();
    }

    final ad = _rewarded;
    if (ad == null) {
      throw const AdNotAvailableException(
        'No ad available right now. Please try again shortly.',
      );
    }

    final completer = Completer<int?>();
    int? reward;
    _emit(AdStatus(phase: AdPhase.showing, isTestAd: _isTestAd));
    ad.fullScreenContentCallback = FullScreenContentCallback(
      onAdDismissedFullScreenContent: (_) {
        if (!completer.isCompleted) {
          completer.complete(reward);
        }
        ad.dispose();
        _rewarded = null;
        _emit(AdStatus.loading(isTestAd: _isTestAd));
        unawaited(preloadRewarded());
      },
      onAdFailedToShowFullScreenContent: (_, error) {
        if (kDebugMode) {
          debugPrint('Rewarded ad failed to show: $error');
        }
        if (!completer.isCompleted) {
          completer.completeError(
            const AdNotAvailableException('Could not show the ad.'),
          );
        }
        ad.dispose();
        _rewarded = null;
        _emit(
          AdStatus(
            phase: AdPhase.unavailable,
            message: error.message,
            errorCode: error.code,
            isTestAd: _isTestAd,
          ),
        );
      },
    );
    unawaited(
      ad.show(
        onUserEarnedReward: (_, rewardItem) {
          reward = rewardItem.amount.toInt();
          _emit(AdStatus(phase: AdPhase.rewardPending, isTestAd: _isTestAd));
        },
      ),
    );

    return completer.future;
  }

  AdPhase _phaseForLoadError(LoadAdError error) {
    return switch (error.code) {
      2 => AdPhase.networkError,
      3 => AdPhase.noFill,
      0 || 1 => AdPhase.invalidConfiguration,
      _ => AdPhase.unavailable,
    };
  }

  @override
  Future<void> openAdInspector() async {
    final completer = Completer<void>();
    MobileAds.instance.openAdInspector((error) {
      if (error == null) {
        completer.complete();
      } else {
        completer.completeError(error);
      }
    });
    return completer.future;
  }
}
