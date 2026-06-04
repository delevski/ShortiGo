import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';

import '../../core/env/env.dart';
import '../../domain/interfaces/ad_gateway.dart';

class AdmobAdGateway implements AdGateway {
  bool _initialized = false;
  RewardedAd? _rewarded;

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

    await MobileAds.instance.initialize();
    _initialized = true;
  }

  @override
  Future<void> preloadRewarded() async {
    if (!_initialized) {
      await initialize();
    }
    if (_rewarded != null) {
      return;
    }

    final completer = Completer<RewardedAd?>();
    await RewardedAd.load(
      adUnitId: _unitId,
      request: const AdRequest(),
      rewardedAdLoadCallback: RewardedAdLoadCallback(
        onAdLoaded: (ad) {
          _rewarded = ad;
          if (!completer.isCompleted) {
            completer.complete(ad);
          }
        },
        onAdFailedToLoad: (error) {
          _rewarded = null;
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
    ad.fullScreenContentCallback = FullScreenContentCallback(
      onAdDismissedFullScreenContent: (_) {
        if (!completer.isCompleted) {
          completer.complete(reward);
        }
        ad.dispose();
        _rewarded = null;
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
      },
    );
    unawaited(
      ad.show(
        onUserEarnedReward: (_, rewardItem) {
          reward = rewardItem.amount.toInt();
        },
      ),
    );

    return completer.future;
  }
}
