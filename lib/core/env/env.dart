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
    required this.rewardApiBaseUrl,
    required bool releaseMode,
  }) : _releaseMode = releaseMode;

  final AppFlavor flavor;
  final String firebaseProjectId;
  final String sentryDsn;
  final String adMobAppIdIos;
  final String adMobAppIdAndroid;
  final String adMobRewardedUnitIdIos;
  final String adMobRewardedUnitIdAndroid;
  final String revenueCatApiKeyIos;
  final String revenueCatApiKeyAndroid;
  final String rewardApiBaseUrl;
  final bool _releaseMode;

  bool get isProd => flavor == AppFlavor.prod;

  /// True for prod builds and for any Flutter release-mode build (even when
  /// `ENV` was forgotten). Release guards (RevenueCat key checks) apply here.
  bool get enforcesReleaseGuards => isProd || _releaseMode;

  /// RevenueCat "Test Store" keys start with `test_`. They are only meant for
  /// debug builds: the SDK shows "Wrong API Key" and closes the app when one
  /// is used in a release build (this got a Google Play release rejected).
  static bool isRevenueCatTestKey(String key) =>
      key.trim().toLowerCase().startsWith('test_');

  /// Why [key] must not be handed to RevenueCat in a release build, or null.
  static String? revenueCatKeyProblem(String key, String defineName) {
    if (key.trim().isEmpty) {
      return '$defineName is empty.';
    }
    if (isRevenueCatTestKey(key)) {
      return '$defineName is a RevenueCat test key (test_...).';
    }
    return null;
  }

  /// iOS RevenueCat key that is safe to configure, or '' when IAP must stay
  /// off. Outside release/prod builds the value passes through unchanged.
  String get safeRevenueCatKeyIos => _safeRevenueCatKey(
        revenueCatApiKeyIos,
        'RC_API_KEY_IOS',
      );

  /// Android RevenueCat key that is safe to configure, or '' (see iOS).
  String get safeRevenueCatKeyAndroid => _safeRevenueCatKey(
        revenueCatApiKeyAndroid,
        'RC_API_KEY_ANDROID',
      );

  String _safeRevenueCatKey(String key, String defineName) {
    if (!enforcesReleaseGuards) {
      return key;
    }
    return revenueCatKeyProblem(key, defineName) == null ? key : '';
  }

  /// Reasons in-app purchases are switched off for this build (empty when
  /// the keys are usable or the guards do not apply).
  List<String> get iapDisabledReasons {
    if (!enforcesReleaseGuards) {
      return const <String>[];
    }
    final reasons = <String>[];
    final ios = revenueCatKeyProblem(revenueCatApiKeyIos, 'RC_API_KEY_IOS');
    if (ios != null) {
      reasons.add(ios);
    }
    final android = revenueCatKeyProblem(
      revenueCatApiKeyAndroid,
      'RC_API_KEY_ANDROID',
    );
    if (android != null) {
      reasons.add(android);
    }
    return reasons;
  }

  static const _googleTestAdMobAppIdIos =
      'ca-app-pub-3940256099942544~1458002511';
  static const _googleTestAdMobAppIdAndroid =
      'ca-app-pub-3940256099942544~3347511713';
  static const _googleTestRewardedUnitIdIos =
      'ca-app-pub-3940256099942544/1712485313';
  static const _googleTestRewardedUnitIdAndroid =
      'ca-app-pub-3940256099942544/5224354917';

  @visibleForTesting
  factory Env.fromValues({
    AppFlavor flavor = AppFlavor.dev,
    String firebaseProjectId = 'shortigo-prod',
    String sentryDsn = '',
    String adMobAppIdIos = _googleTestAdMobAppIdIos,
    String adMobAppIdAndroid = _googleTestAdMobAppIdAndroid,
    String adMobRewardedUnitIdIos = _googleTestRewardedUnitIdIos,
    String adMobRewardedUnitIdAndroid = _googleTestRewardedUnitIdAndroid,
    String revenueCatApiKeyIos = '',
    String revenueCatApiKeyAndroid = '',
    String rewardApiBaseUrl = '',
    bool releaseMode = kReleaseMode,
  }) {
    return Env._(
      flavor: flavor,
      firebaseProjectId: firebaseProjectId,
      sentryDsn: sentryDsn,
      adMobAppIdIos: adMobAppIdIos,
      adMobAppIdAndroid: adMobAppIdAndroid,
      adMobRewardedUnitIdIos: adMobRewardedUnitIdIos,
      adMobRewardedUnitIdAndroid: adMobRewardedUnitIdAndroid,
      revenueCatApiKeyIos: revenueCatApiKeyIos,
      revenueCatApiKeyAndroid: revenueCatApiKeyAndroid,
      rewardApiBaseUrl: rewardApiBaseUrl,
      releaseMode: releaseMode,
    );
  }

  List<String> get releaseBlockingIssues {
    if (!isProd) {
      return const <String>[];
    }

    final issues = <String>[];
    if (sentryDsn.isEmpty) {
      issues.add('SENTRY_DSN is empty.');
    }
    if (adMobAppIdIos.isEmpty) {
      issues.add('ADMOB_APP_ID_IOS is empty.');
    } else if (adMobAppIdIos == _googleTestAdMobAppIdIos) {
      issues.add('ADMOB_APP_ID_IOS is still the Google test app ID.');
    }
    if (adMobAppIdAndroid.isEmpty) {
      issues.add('ADMOB_APP_ID_ANDROID is empty.');
    } else if (adMobAppIdAndroid == _googleTestAdMobAppIdAndroid) {
      issues.add('ADMOB_APP_ID_ANDROID is still the Google test app ID.');
    }
    if (adMobRewardedUnitIdIos.isEmpty) {
      issues.add('ADMOB_REWARDED_IOS is empty.');
    } else if (adMobRewardedUnitIdIos == _googleTestRewardedUnitIdIos) {
      issues.add('ADMOB_REWARDED_IOS is still the Google test ad unit ID.');
    }
    if (adMobRewardedUnitIdAndroid.isEmpty) {
      issues.add('ADMOB_REWARDED_ANDROID is empty.');
    } else if (adMobRewardedUnitIdAndroid == _googleTestRewardedUnitIdAndroid) {
      issues.add(
        'ADMOB_REWARDED_ANDROID is still the Google test ad unit ID.',
      );
    }
    final rcIos = revenueCatKeyProblem(revenueCatApiKeyIos, 'RC_API_KEY_IOS');
    if (rcIos != null) {
      issues.add(rcIos);
    }
    final rcAndroid = revenueCatKeyProblem(
      revenueCatApiKeyAndroid,
      'RC_API_KEY_ANDROID',
    );
    if (rcAndroid != null) {
      issues.add(rcAndroid);
    }
    if (rewardApiBaseUrl.isEmpty) {
      issues.add('REWARD_API_BASE_URL is empty.');
    }
    return issues;
  }

  bool get hasReleaseBlockingIssues => releaseBlockingIssues.isNotEmpty;

  /// Built from --dart-define values. Defaults to the single Spark project.
  factory Env.fromDefines() {
    const flavorStr = String.fromEnvironment('ENV', defaultValue: 'dev');
    const flavor = flavorStr == 'prod' ? AppFlavor.prod : AppFlavor.dev;

    return Env.fromValues(
      flavor: flavor,
      firebaseProjectId: const String.fromEnvironment(
        'FIREBASE_PROJECT_ID',
        defaultValue: 'shortigo-prod',
      ),
      sentryDsn: const String.fromEnvironment(
        'SENTRY_DSN',
        defaultValue: '',
      ),
      adMobAppIdIos: const String.fromEnvironment(
        'ADMOB_APP_ID_IOS',
        defaultValue: _googleTestAdMobAppIdIos,
      ),
      adMobAppIdAndroid: const String.fromEnvironment(
        'ADMOB_APP_ID_ANDROID',
        defaultValue: _googleTestAdMobAppIdAndroid,
      ),
      adMobRewardedUnitIdIos: const String.fromEnvironment(
        'ADMOB_REWARDED_IOS',
        defaultValue: _googleTestRewardedUnitIdIos,
      ),
      adMobRewardedUnitIdAndroid: const String.fromEnvironment(
        'ADMOB_REWARDED_ANDROID',
        defaultValue: _googleTestRewardedUnitIdAndroid,
      ),
      revenueCatApiKeyIos: const String.fromEnvironment(
        'RC_API_KEY_IOS',
        defaultValue: '',
      ),
      revenueCatApiKeyAndroid: const String.fromEnvironment(
        'RC_API_KEY_ANDROID',
        defaultValue: '',
      ),
      rewardApiBaseUrl: const String.fromEnvironment(
        'REWARD_API_BASE_URL',
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
