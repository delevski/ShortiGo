import 'package:firebase_auth/firebase_auth.dart' as fb;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:shortigo/core/providers.dart';
import 'package:shortigo/domain/entities/transaction.dart';
import 'package:shortigo/domain/entities/user.dart';
import 'package:shortigo/domain/interfaces/ad_gateway.dart';
import 'package:shortigo/domain/interfaces/user_repository.dart';
import 'package:shortigo/features/rewards/application/rewards_notifier.dart';

class _MockFirebaseUser extends Mock implements fb.User {}

class _MockAdGateway extends Mock implements AdGateway {}

class _MockUserRepository extends Mock implements UserRepository {}

void main() {
  late _MockFirebaseUser authUser;
  late _MockAdGateway adGateway;
  late _MockUserRepository userRepository;
  late AppUser appUser;

  setUpAll(() {
    registerFallbackValue(TxType.adReward);
  });

  setUp(() {
    authUser = _MockFirebaseUser();
    adGateway = _MockAdGateway();
    userRepository = _MockUserRepository();
    appUser = AppUser(
      id: 'user-1',
      email: 'viewer@example.com',
      displayName: 'Viewer',
      createdAt: DateTime.utc(2026, 6, 4),
    );

    when(() => authUser.uid).thenReturn(appUser.id);
    when(adGateway.initialize).thenAnswer((_) async {});
    when(adGateway.preloadRewarded).thenAnswer((_) async {});
    when(() => adGateway.status)
        .thenAnswer((_) => Stream.value(const AdStatus.loading()));
    when(() => adGateway.currentStatus).thenReturn(const AdStatus.loading());
    when(() => userRepository.watch(appUser.id))
        .thenAnswer((_) => Stream.value(appUser));
  });

  ProviderContainer buildContainer() {
    return ProviderContainer(
      overrides: [
        currentAuthUserProvider.overrideWith((_) => Stream.value(authUser)),
        adGatewayProvider.overrideWithValue(adGateway),
        userRepositoryProvider.overrideWithValue(userRepository),
      ],
    );
  }

  test('rewarded-ad failures remain visible after loading finishes', () async {
    when(adGateway.showRewarded).thenThrow(
      const AdNotAvailableException('No ad available right now.'),
    );
    final container = buildContainer();
    addTearDown(container.dispose);
    await container.read(currentAuthUserProvider.future);
    await container.read(rewardsNotifierProvider.future);

    await container.read(rewardsNotifierProvider.notifier).watchAdForCoins();

    final state = container.read(rewardsNotifierProvider).requireValue;
    expect(state.isWatchingAd, isFalse);
    expect(state.error, 'No ad available right now.');
    verifyNever(
      () => userRepository.grantDemoBonus(
        userId: any(named: 'userId'),
        type: any(named: 'type'),
        amount: any(named: 'amount'),
        reference: any(named: 'reference'),
      ),
    );
  });

  test('earned rewarded ads grant the fixed Spark bonus', () async {
    when(adGateway.showRewarded).thenAnswer((_) async => 1);
    when(
      () => userRepository.grantDemoBonus(
        userId: any(named: 'userId'),
        type: any(named: 'type'),
        amount: any(named: 'amount'),
        reference: any(named: 'reference'),
      ),
    ).thenAnswer((_) async {});
    final container = buildContainer();
    addTearDown(container.dispose);
    await container.read(currentAuthUserProvider.future);
    await container.read(rewardsNotifierProvider.future);

    await container.read(rewardsNotifierProvider.notifier).watchAdForCoins();

    final state = container.read(rewardsNotifierProvider).requireValue;
    expect(state.isWatchingAd, isFalse);
    expect(state.error, isNull);
    verify(
      () => userRepository.grantDemoBonus(
        userId: appUser.id,
        type: TxType.adReward,
        amount: 12,
        reference: any(named: 'reference'),
      ),
    ).called(1);
  });

  test('exposes rewarded-ad readiness to the rewards screen', () async {
    when(() => adGateway.status).thenAnswer(
      (_) => Stream.value(const AdStatus.ready(isTestAd: true)),
    );
    when(() => adGateway.currentStatus)
        .thenReturn(const AdStatus.ready(isTestAd: true));
    final container = buildContainer();
    addTearDown(container.dispose);
    await container.read(currentAuthUserProvider.future);
    await container.read(rewardsNotifierProvider.future);
    await Future<void>.delayed(Duration.zero);

    final state = container.read(rewardsNotifierProvider).requireValue;
    expect(state.adStatus.phase, AdPhase.ready);
    expect(state.adStatus.isTestAd, isTrue);
  });
}
