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
}
