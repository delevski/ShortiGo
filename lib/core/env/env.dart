import 'package:flutter/foundation.dart';

enum AppFlavor { dev, prod }

class Env {
  Env._({
    required this.flavor,
    required this.firebaseProjectId,
    required this.sentryDsn,
    required this.adMobAppIdIos,
    required this.adMobAppIdAndroid,
    required this.adMobRewardedUnitIdIos,
    required this.adMobRewardedUnitIdAndroid,
    required this.revenueCatApiKeyIos,
    required this.revenueCatApiKeyAndroid,
  });

  final AppFlavor flavor;
  final String firebaseProjectId;
  final String sentryDsn;
  final String adMobAppIdIos;
  final String adMobAppIdAndroid;
  final String adMobRewardedUnitIdIos;
  final String adMobRewardedUnitIdAndroid;
  final String revenueCatApiKeyIos;
  final String revenueCatApiKeyAndroid;

  bool get isProd => flavor == AppFlavor.prod;

  /// Built from --dart-define values. Defaults to dev if unset.
  factory Env.fromDefines() {
    const flavorStr = String.fromEnvironment('ENV', defaultValue: 'dev');
    const flavor = flavorStr == 'prod' ? AppFlavor.prod : AppFlavor.dev;

    return Env._(
      flavor: flavor,
      firebaseProjectId: const String.fromEnvironment(
        'FIREBASE_PROJECT_ID',
        defaultValue: 'shortigo-dev',
      ),
      sentryDsn: const String.fromEnvironment(
        'SENTRY_DSN',
        defaultValue: '',
      ),
      adMobAppIdIos: const String.fromEnvironment(
        'ADMOB_APP_ID_IOS',
        defaultValue: 'ca-app-pub-3940256099942544~1458002511',
      ),
      adMobAppIdAndroid: const String.fromEnvironment(
        'ADMOB_APP_ID_ANDROID',
        defaultValue: 'ca-app-pub-3940256099942544~3347511713',
      ),
      adMobRewardedUnitIdIos: const String.fromEnvironment(
        'ADMOB_REWARDED_IOS',
        defaultValue: 'ca-app-pub-3940256099942544/1712485313',
      ),
      adMobRewardedUnitIdAndroid: const String.fromEnvironment(
        'ADMOB_REWARDED_ANDROID',
        defaultValue: 'ca-app-pub-3940256099942544/5224354917',
      ),
      revenueCatApiKeyIos: const String.fromEnvironment(
        'RC_API_KEY_IOS',
        defaultValue: '',
      ),
      revenueCatApiKeyAndroid: const String.fromEnvironment(
        'RC_API_KEY_ANDROID',
        defaultValue: '',
      ),
    );
  }

  @override
  String toString() =>
      'Env(flavor: ${flavor.name}, project: $firebaseProjectId)';

  @override
  bool operator ==(Object other) =>
      other is Env &&
      other.flavor == flavor &&
      other.firebaseProjectId == firebaseProjectId;

  @override
  int get hashCode => Object.hash(flavor, firebaseProjectId);
}

/// Global singleton; initialized in main().
late final Env env;

@visibleForTesting
Env debugEnv = Env.fromDefines();
