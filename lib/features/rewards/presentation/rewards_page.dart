import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/error/friendly_error.dart';
import '../../../core/theme/app_colors.dart';
import '../../../domain/interfaces/ad_gateway.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../application/reward_progress.dart';
import '../application/rewards_notifier.dart';

class RewardsPage extends ConsumerWidget {
  const RewardsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(rewardsNotifierProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Rewards')),
      body: async.when(
        loading: () => const LoadingView(),
        error: (error, _) => ErrorView(
          error: friendlyErrorFor(error),
          onRetry: () => ref.invalidate(rewardsNotifierProvider),
        ),
        data: (state) {
          if (state.requiresSignIn) {
            return const _SignInRewards();
          }

          final user = state.user;
          final bonus = user?.bonus ?? 0;
          final progress = RewardProgress.fromBonus(bonus);

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _BonusHeader(bonus: bonus, progress: progress),
              const SizedBox(height: 24),
              _SectionTitle(
                title: 'Keep your streak alive',
                trailing: _StreakBadge(
                  active: _claimedToday(user?.lastDailyCheckIn),
                ),
              ),
              const SizedBox(height: 10),
              _DailyCheckIn(
                claimed: _claimedToday(user?.lastDailyCheckIn),
              ),
              const SizedBox(height: 16),
              _WatchAd(
                isWatching: state.isWatchingAd,
                status: state.adStatus,
                onTap: () {
                  ref.read(rewardsNotifierProvider.notifier).watchAdForCoins();
                },
                onRetry: () {
                  ref.read(rewardsNotifierProvider.notifier).retryAd();
                },
              ),
              const SizedBox(height: 24),
              const _SectionTitle(title: 'Achievements'),
              const SizedBox(height: 10),
              _Achievements(bonus: bonus, isVip: user?.isVip ?? false),
              if (state.error != null) ...[
                const SizedBox(height: 12),
                Text(
                  state.error!,
                  style: const TextStyle(color: AppColors.error),
                ),
              ],
            ],
          );
        },
      ),
    );
  }

  static bool _claimedToday(DateTime? lastClaim) {
    if (lastClaim == null) {
      return false;
    }
    final now = DateTime.now().toUtc();
    final claim = lastClaim.toUtc();
    return now.year == claim.year &&
        now.month == claim.month &&
        now.day == claim.day;
  }
}

class _SignInRewards extends StatelessWidget {
  const _SignInRewards();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.card_giftcard_outlined, size: 44),
            const SizedBox(height: 12),
            const Text(
              'Sign in to earn bonus',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'Daily check-ins and ad rewards are saved to your wallet.',
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () => context.push('/login'),
              child: const Text('Sign in'),
            ),
          ],
        ),
      ),
    );
  }
}

class _BonusHeader extends StatelessWidget {
  const _BonusHeader({required this.bonus, required this.progress});

  final int bonus;
  final RewardProgress progress;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.primary, AppColors.accent],
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.bolt, color: Colors.white, size: 40),
              const SizedBox(width: 12),
              Text(
                '$bonus',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 36,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(width: 8),
              const Text('Bonus', style: TextStyle(color: Colors.white70)),
            ],
          ),
          const SizedBox(height: 14),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress.fraction,
              minHeight: 8,
              backgroundColor: Colors.white24,
              color: AppColors.vipGold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            progress.remaining == 0
                ? 'You have enough to unlock an episode'
                : '${progress.remaining} bonus until your next episode unlock',
            style: const TextStyle(color: Colors.white),
          ),
        ],
      ),
    );
  }
}

class _DailyCheckIn extends ConsumerWidget {
  const _DailyCheckIn({required this.claimed});

  final bool claimed;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Card(
      child: ListTile(
        leading: const Icon(Icons.calendar_today, color: AppColors.primary),
        title: const Text('Daily check-in'),
        subtitle: Text(claimed ? 'Claimed today' : '+5 bonus'),
        trailing: FilledButton(
          style: FilledButton.styleFrom(
            minimumSize: const Size(72, 40),
            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
          ),
          onPressed: claimed
              ? null
              : () {
                  ref
                      .read(rewardsNotifierProvider.notifier)
                      .claimDailyCheckIn();
                },
          child: Text(claimed ? 'Done' : 'Claim'),
        ),
      ),
    );
  }
}

class _WatchAd extends StatelessWidget {
  const _WatchAd({
    required this.isWatching,
    required this.status,
    required this.onTap,
    required this.onRetry,
  });

  final bool isWatching;
  final AdStatus status;
  final VoidCallback onTap;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: const Icon(Icons.play_circle_outline, color: AppColors.accent),
        title: const Text('Watch an ad'),
        subtitle: Text(_subtitle),
        trailing: isWatching
            ? const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : FilledButton(
                style: FilledButton.styleFrom(
                  minimumSize: const Size(72, 40),
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                onPressed: status.canShow ? onTap : onRetry,
                child: Text(status.canShow ? 'Watch' : 'Retry'),
              ),
      ),
    );
  }

  String get _subtitle {
    return switch (status.phase) {
      AdPhase.ready =>
        status.isTestAd ? 'Test ad ready · +12 bonus' : '+12 bonus',
      AdPhase.initializing || AdPhase.loading => 'Preparing an ad...',
      AdPhase.showing => 'Ad is playing',
      AdPhase.rewardPending => 'Confirming your reward...',
      AdPhase.noFill => 'No ad available yet',
      AdPhase.networkError => 'Check your connection',
      AdPhase.invalidConfiguration => 'Ad setup needs attention',
      AdPhase.unavailable => 'Ad unavailable right now',
    };
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title, this.trailing});

  final String title;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(title, style: Theme.of(context).textTheme.titleMedium),
        ),
        if (trailing != null) trailing!,
      ],
    );
  }
}

class _StreakBadge extends StatelessWidget {
  const _StreakBadge({required this.active});

  final bool active;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          Icons.local_fire_department,
          size: 18,
          color: active ? AppColors.warning : AppColors.textMuted,
        ),
        const SizedBox(width: 4),
        Text(active ? 'Active today' : 'Start today'),
      ],
    );
  }
}

class _Achievements extends StatelessWidget {
  const _Achievements({required this.bonus, required this.isVip});

  final int bonus;
  final bool isVip;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _Achievement(
            icon: Icons.bolt,
            label: 'First Spark',
            unlocked: bonus > 0,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _Achievement(
            icon: Icons.lock_open,
            label: 'Unlock ready',
            unlocked: bonus >= 60,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _Achievement(
            icon: Icons.workspace_premium,
            label: 'VIP viewer',
            unlocked: isVip,
          ),
        ),
      ],
    );
  }
}

class _Achievement extends StatelessWidget {
  const _Achievement({
    required this.icon,
    required this.label,
    required this.unlocked,
  });

  final IconData icon;
  final String label;
  final bool unlocked;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: unlocked ? AppColors.vipGold : AppColors.divider,
        ),
      ),
      child: Column(
        children: [
          Icon(icon, color: unlocked ? AppColors.vipGold : AppColors.textMuted),
          const SizedBox(height: 6),
          Text(label, textAlign: TextAlign.center),
        ],
      ),
    );
  }
}
