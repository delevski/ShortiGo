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

    final completer = Completer<RewardedAd?>();
    await RewardedAd.load(
      adUnitId: _unitId,
      request: const AdRequest(),
      rewardedAdLoadCallback: RewardedAdLoadCallback(
        onAdLoaded: (ad) {
          _rewarded = ad;
          completer.complete(ad);
        },
        onAdFailedToLoad: (_) {
          _rewarded = null;
          completer.complete(null);
        },
      ),
    );

    await completer.future;
  }

  @override
  Future<int?> showRewarded() async {
    final ad = _rewarded;
    if (ad == null) {
      await preloadRewarded();
      return null;
    }

    final completer = Completer<int?>();
    int? reward;
    ad.fullScreenContentCallback = FullScreenContentCallback(
      onAdDismissedFullScreenContent: (_) {
        completer.complete(reward);
        ad.dispose();
        _rewarded = null;
        unawaited(preloadRewarded());
      },
      onAdFailedToShowFullScreenContent: (_, __) {
        completer.complete(null);
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
