import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers.dart';
import '../../../domain/entities/transaction.dart';
import '../../../domain/entities/user.dart';

class RewardsState {
  const RewardsState({
    this.user,
    this.isWatchingAd = false,
    this.error,
  });

  final AppUser? user;
  final bool isWatchingAd;
  final String? error;
}

class RewardsNotifier extends AsyncNotifier<RewardsState> {
  static const _dailyBonus = 5;
  static const _adBonus = 12;
  static const _dailyCooldown = Duration(hours: 20);

  StreamSubscription<AppUser>? _userSub;

  @override
  Future<RewardsState> build() async {
    final auth = ref.watch(currentAuthUserProvider).value;
    if (auth == null) {
      return const RewardsState();
    }

    final userRepo = ref.read(userRepositoryProvider);
    _userSub = userRepo.watch(auth.uid).listen((user) {
      state = AsyncData(RewardsState(user: user));
    });
    ref.onDispose(() => _userSub?.cancel());

    return const RewardsState();
  }

  Future<void> claimDailyCheckIn() async {
    final current = state.value;
    final auth = ref.read(currentAuthUserProvider).value;
    final user = current?.user;
    if (auth == null || user == null) {
      state = AsyncData(
        RewardsState(user: user, error: 'Sign in required.'),
      );
      return;
    }

    final now = DateTime.now().toUtc();
    final last = user.lastDailyCheckIn?.toUtc();
    if (last != null && now.difference(last) < _dailyCooldown) {
      state = AsyncData(
        RewardsState(
          user: user,
          error: 'Already claimed today. Come back later.',
        ),
      );
      return;
    }

    try {
      await ref.read(userRepositoryProvider).grantDemoBonus(
            userId: auth.uid,
            type: TxType.dailyCheckIn,
            amount: _dailyBonus,
            reference: 'sparkDailyCheckIn',
            dailyCheckInAt: now,
          );
    } catch (error) {
      state = AsyncData(
        RewardsState(
          user: user,
          error: error.toString(),
        ),
      );
    }
  }

  Future<void> watchAdForCoins() async {
    final current = state.value;
    final auth = ref.read(currentAuthUserProvider).value;
    if (auth == null) {
      state = AsyncData(
        RewardsState(user: current?.user, error: 'Sign in required.'),
      );
      return;
    }

    state = AsyncData(
      RewardsState(user: current?.user, isWatchingAd: true),
    );

    try {
      final ad = ref.read(adGatewayProvider);
      await ad.initialize();
      final amount = await ad.showRewarded();
      if (amount != null) {
        await ref.read(userRepositoryProvider).grantDemoBonus(
              userId: auth.uid,
              type: TxType.adReward,
              amount: _adBonus,
              reference: 'sparkRewardedAd:${DateTime.now().toIso8601String()}',
            );
      }
    } catch (error) {
      state = AsyncData(
        RewardsState(user: current?.user, error: error.toString()),
      );
    } finally {
      state = AsyncData(RewardsState(user: state.value?.user));
    }
  }
}

final rewardsNotifierProvider =
    AsyncNotifierProvider<RewardsNotifier, RewardsState>(
  RewardsNotifier.new,
);
