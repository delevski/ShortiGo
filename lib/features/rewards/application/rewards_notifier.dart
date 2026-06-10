import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers.dart';
import '../../../domain/entities/transaction.dart';
import '../../../domain/entities/user.dart';
import '../../../domain/interfaces/ad_gateway.dart';

class RewardsState {
  const RewardsState({
    this.user,
    this.requiresSignIn = false,
    this.isWatchingAd = false,
    this.adStatus = const AdStatus(phase: AdPhase.initializing),
    this.error,
  });

  final AppUser? user;
  final bool requiresSignIn;
  final bool isWatchingAd;
  final AdStatus adStatus;
  final String? error;

  RewardsState copyWith({
    AppUser? user,
    bool? requiresSignIn,
    bool? isWatchingAd,
    AdStatus? adStatus,
    String? error,
    bool clearError = false,
  }) {
    return RewardsState(
      user: user ?? this.user,
      requiresSignIn: requiresSignIn ?? this.requiresSignIn,
      isWatchingAd: isWatchingAd ?? this.isWatchingAd,
      adStatus: adStatus ?? this.adStatus,
      error: clearError ? null : error ?? this.error,
    );
  }
}

class RewardsNotifier extends AsyncNotifier<RewardsState> {
  static const _dailyBonus = 5;
  static const _adBonus = 12;
  static const _dailyCooldown = Duration(hours: 20);

  StreamSubscription<AppUser>? _userSub;
  StreamSubscription<AdStatus>? _adSub;

  @override
  Future<RewardsState> build() async {
    final auth = ref.watch(currentAuthUserProvider).value;
    if (auth == null) {
      return const RewardsState(requiresSignIn: true);
    }

    final userRepo = ref.read(userRepositoryProvider);
    _userSub = userRepo.watch(auth.uid).listen((user) {
      state =
          AsyncData((state.value ?? const RewardsState()).copyWith(user: user));
    });

    // Warm up a rewarded ad so the first "Watch" tap can show it instantly.
    final ad = ref.read(adGatewayProvider);
    _adSub = ad.status.listen((status) {
      state = AsyncData(
        (state.value ?? const RewardsState()).copyWith(adStatus: status),
      );
    });
    ref.onDispose(() {
      _userSub?.cancel();
      _adSub?.cancel();
    });
    unawaited(ad.initialize().then((_) => ad.preloadRewarded()));

    return RewardsState(adStatus: ad.currentStatus);
  }

  Future<void> claimDailyCheckIn() async {
    final current = state.value;
    final auth = ref.read(currentAuthUserProvider).value;
    final user = current?.user;
    if (auth == null || user == null) {
      state = AsyncData(
        (current ?? const RewardsState()).copyWith(
          user: user,
          error: 'Sign in required.',
        ),
      );
      return;
    }

    final now = DateTime.now().toUtc();
    final last = user.lastDailyCheckIn?.toUtc();
    if (last != null && now.difference(last) < _dailyCooldown) {
      state = AsyncData(
        (current ?? RewardsState(user: user)).copyWith(
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
        (current ?? RewardsState(user: user)).copyWith(
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
        (current ?? const RewardsState()).copyWith(
          error: 'Sign in required.',
        ),
      );
      return;
    }

    state = AsyncData(
      (current ?? const RewardsState())
          .copyWith(isWatchingAd: true, clearError: true),
    );

    String? errorMessage;
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
      errorMessage = error.toString();
    } finally {
      state = AsyncData(
        (state.value ?? const RewardsState()).copyWith(
          isWatchingAd: false,
          error: errorMessage,
          clearError: errorMessage == null,
        ),
      );
    }
  }

  Future<void> retryAd() async {
    final ad = ref.read(adGatewayProvider);
    await ad.preloadRewarded();
  }

  Future<void> openAdInspector() {
    return ref.read(adGatewayProvider).openAdInspector();
  }
}

final rewardsNotifierProvider =
    AsyncNotifierProvider<RewardsNotifier, RewardsState>(
  RewardsNotifier.new,
);
