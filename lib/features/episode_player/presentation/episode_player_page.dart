import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/error/friendly_error.dart';
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
          data: (state) => Center(
            child: EpisodePlayerView(controller: state.controller!),
          ),
        ),
      ),
    );
  }
}
