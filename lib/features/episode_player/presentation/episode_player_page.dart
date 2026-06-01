import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/error/friendly_error.dart';
import '../../../core/providers.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../application/episode_player_notifier.dart';
import 'episode_player_view.dart';

class EpisodePlayerPage extends ConsumerWidget {
  const EpisodePlayerPage({
    super.key,
    required this.seriesId,
    required this.episodeId,
  });

  final String seriesId;
  final String episodeId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final args = EpisodePlayerArgs(
      seriesId: seriesId,
      episodeId: episodeId,
    );
    final async = ref.watch(episodePlayerNotifierProvider(args));

    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: async.when(
          loading: () => const LoadingView(),
          error: (error, _) => ErrorView(
            error: friendlyErrorFor(error),
            onRetry: () => ref.invalidate(episodePlayerNotifierProvider(args)),
          ),
          data: (state) {
            final user = ref.watch(currentAppUserDocProvider).value;
            if (state.episode?.isVipLocked == true &&
                !(user?.isVip ?? false)) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      Icons.lock,
                      size: 64,
                      color: AppColors.vipGold,
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'This episode is VIP-only',
                      style: TextStyle(color: Colors.white),
                    ),
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed: () => context.push('/subscribe'),
                      child: const Text('Get VIP'),
                    ),
                  ],
                ),
              );
            }

            return Center(
              child: EpisodePlayerView(controller: state.controller!),
            );
          },
        ),
      ),
    );
  }
}
