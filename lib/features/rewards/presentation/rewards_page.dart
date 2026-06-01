import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/error/friendly_error.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
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
          final user = state.user;

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _BonusHeader(bonus: user?.bonus ?? 0),
              const SizedBox(height: 24),
              const _DailyCheckIn(),
              const SizedBox(height: 16),
              _WatchAd(
                isWatching: state.isWatchingAd,
                onTap: () {
                  ref.read(rewardsNotifierProvider.notifier).watchAdForCoins();
                },
              ),
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
}

class _BonusHeader extends StatelessWidget {
  const _BonusHeader({required this.bonus});

  final int bonus;

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
      child: Row(
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
    );
  }
}

class _DailyCheckIn extends ConsumerWidget {
  const _DailyCheckIn();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Card(
      child: ListTile(
        leading: const Icon(Icons.calendar_today, color: AppColors.primary),
        title: const Text('Daily check-in'),
        subtitle: const Text('+5 bonus'),
        trailing: FilledButton(
          onPressed: () {
            ref.read(rewardsNotifierProvider.notifier).claimDailyCheckIn();
          },
          child: const Text('Claim'),
        ),
      ),
    );
  }
}

class _WatchAd extends StatelessWidget {
  const _WatchAd({
    required this.isWatching,
    required this.onTap,
  });

  final bool isWatching;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: const Icon(Icons.play_circle_outline, color: AppColors.accent),
        title: const Text('Watch an ad'),
        subtitle: const Text('+12 bonus'),
        trailing: isWatching
            ? const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : FilledButton(onPressed: onTap, child: const Text('Watch')),
      ),
    );
  }
}
