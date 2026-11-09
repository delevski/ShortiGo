import 'package:flutter_test/flutter_test.dart';
import 'package:shortigo/core/env/env.dart';

void main() {
  group('Env release readiness', () {
    test('prod defaults report release-blocking placeholder configuration', () {
      final env = Env.fromValues(flavor: AppFlavor.prod);

      expect(
        env.releaseBlockingIssues,
        containsAll(<String>[
          'SENTRY_DSN is empty.',
          'ADMOB_APP_ID_IOS is still the Google test app ID.',
          'ADMOB_APP_ID_ANDROID is still the Google test app ID.',
          'ADMOB_REWARDED_IOS is still the Google test ad unit ID.',
          'ADMOB_REWARDED_ANDROID is still the Google test ad unit ID.',
          'RC_API_KEY_IOS is empty.',
          'RC_API_KEY_ANDROID is empty.',
          'REWARD_API_BASE_URL is empty.',
        ]),
      );
      expect(env.hasReleaseBlockingIssues, isTrue);
    });

    test('prod with configured service keys has no release blockers', () {
      final env = Env.fromValues(
        flavor: AppFlavor.prod,
        sentryDsn: 'https://public@example.ingest.sentry.io/123',
        adMobAppIdIos: 'ca-app-pub-1234567890123456~1111111111',
        adMobAppIdAndroid: 'ca-app-pub-1234567890123456~2222222222',
        adMobRewardedUnitIdIos: 'ca-app-pub-1234567890123456/3333333333',
        adMobRewardedUnitIdAndroid: 'ca-app-pub-1234567890123456/4444444444',
        revenueCatApiKeyIos: 'appl_abcdefghijklmnop',
        revenueCatApiKeyAndroid: 'goog_abcdefghijklmnop',
        rewardApiBaseUrl: 'https://shortigo-rewards-api.example.workers.dev',
      );

      expect(env.releaseBlockingIssues, isEmpty);
      expect(env.hasReleaseBlockingIssues, isFalse);
    });

    test('dev defaults do not block local development', () {
      final env = Env.fromValues();

      expect(env.releaseBlockingIssues, isEmpty);
      expect(env.hasReleaseBlockingIssues, isFalse);
    });
  });

  group('Env RevenueCat release guard', () {
    const goodAdMob = <String, String>{
      'ios': 'ca-app-pub-1234567890123456~1111111111',
      'android': 'ca-app-pub-1234567890123456~2222222222',
    };

    Env prod({
      String ios = 'appl_abcdefghijklmnop',
      String android = 'goog_abcdefghijklmnop',
    }) {
      return Env.fromValues(
        flavor: AppFlavor.prod,
        sentryDsn: 'https://public@example.ingest.sentry.io/123',
        adMobAppIdIos: goodAdMob['ios']!,
        adMobAppIdAndroid: goodAdMob['android']!,
        adMobRewardedUnitIdIos: 'ca-app-pub-1234567890123456/3333333333',
        adMobRewardedUnitIdAndroid: 'ca-app-pub-1234567890123456/4444444444',
        revenueCatApiKeyIos: ios,
        revenueCatApiKeyAndroid: android,
        rewardApiBaseUrl: 'https://shortigo-rewards-api.example.workers.dev',
      );
    }

    test('detects RevenueCat test keys case-insensitively', () {
      expect(Env.isRevenueCatTestKey('test_RNabc'), isTrue);
      expect(Env.isRevenueCatTestKey('  TEST_abc'), isTrue);
      expect(Env.isRevenueCatTestKey('goog_abc'), isFalse);
      expect(Env.isRevenueCatTestKey('appl_abc'), isFalse);
      expect(Env.isRevenueCatTestKey(''), isFalse);
    });

    test('prod with an Android test key reports a release blocker', () {
      final env = prod(android: 'test_RNabcdefghijkl');

      expect(
        env.releaseBlockingIssues,
        contains('RC_API_KEY_ANDROID is a RevenueCat test key (test_...).'),
      );
      expect(env.hasReleaseBlockingIssues, isTrue);
    });

    test('prod with an iOS test key reports a release blocker', () {
      final env = prod(ios: 'test_RNabcdefghijkl');

      expect(
        env.releaseBlockingIssues,
        contains('RC_API_KEY_IOS is a RevenueCat test key (test_...).'),
      );
    });

    test('prod never hands a test or empty key to RevenueCat', () {
      final env = prod(ios: '', android: 'test_RNabcdefghijkl');

      expect(env.safeRevenueCatKeyIos, isEmpty);
      expect(env.safeRevenueCatKeyAndroid, isEmpty);
      expect(
        env.iapDisabledReasons,
        <String>[
          'RC_API_KEY_IOS is empty.',
          'RC_API_KEY_ANDROID is a RevenueCat test key (test_...).',
        ],
      );
    });

    test('prod drops only the bad key and keeps the good one', () {
      final env = prod(android: 'test_RNabcdefghijkl');

      expect(env.safeRevenueCatKeyIos, 'appl_abcdefghijklmnop');
      expect(env.safeRevenueCatKeyAndroid, isEmpty);
    });

    test('prod with valid keys passes them through and stays enabled', () {
      final env = prod();

      expect(env.safeRevenueCatKeyIos, 'appl_abcdefghijklmnop');
      expect(env.safeRevenueCatKeyAndroid, 'goog_abcdefghijklmnop');
      expect(env.iapDisabledReasons, isEmpty);
      expect(env.releaseBlockingIssues, isEmpty);
    });

    test('release mode applies the guard even when ENV is not prod', () {
      final env = Env.fromValues(
        revenueCatApiKeyAndroid: 'test_RNabcdefghijkl',
        releaseMode: true,
      );

      expect(env.isProd, isFalse);
      expect(env.safeRevenueCatKeyAndroid, isEmpty);
      expect(env.iapDisabledReasons, isNotEmpty);
    });

    test('dev debug builds may still use a test key', () {
      final env = Env.fromValues(
        revenueCatApiKeyAndroid: 'test_RNabcdefghijkl',
        releaseMode: false,
      );

      expect(env.enforcesReleaseGuards, isFalse);
      expect(env.safeRevenueCatKeyAndroid, 'test_RNabcdefghijkl');
      expect(env.iapDisabledReasons, isEmpty);
    });
  });
}
