import 'dart:async';

import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers.dart';
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
    try {
      await FirebaseFunctions.instance
          .httpsCallable('grantDailyCheckIn')
          .call<Map<String, dynamic>>();
    } catch (_) {
      state = AsyncData(
        RewardsState(
          user: current?.user,
          error: 'Already claimed today or sign-in required.',
        ),
      );
    }
  }

  Future<void> watchAdForCoins() async {
    final current = state.value;
    state = AsyncData(
      RewardsState(user: current?.user, isWatchingAd: true),
    );

    try {
      final ad = ref.read(adGatewayProvider);
      await ad.initialize();
      final amount = await ad.showRewarded();
      if (amount != null) {
        await FirebaseFunctions.instance
            .httpsCallable('grantAdReward')
            .call<Map<String, dynamic>>({
          'adUnitId': 'rewarded',
          'adId': DateTime.now().toIso8601String(),
        });
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
