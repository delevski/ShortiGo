import 'package:better_player_plus/better_player_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/perf/trace.dart';
import '../../../core/providers.dart';
import '../../../domain/entities/episode.dart';

class EpisodePlayerState {
  const EpisodePlayerState({this.controller, this.episode, this.error});

  final BetterPlayerController? controller;
  final Episode? episode;
  final String? error;
}

class EpisodePlayerArgs {
  const EpisodePlayerArgs({
    required this.seriesId,
    required this.episodeId,
  });

  final String seriesId;
  final String episodeId;

  @override
  bool operator ==(Object other) {
    return other is EpisodePlayerArgs &&
        other.seriesId == seriesId &&
        other.episodeId == episodeId;
  }

  @override
  int get hashCode => Object.hash(seriesId, episodeId);
}

class EpisodePlayerNotifier
    extends FamilyAsyncNotifier<EpisodePlayerState, EpisodePlayerArgs> {
  @override
  Future<EpisodePlayerState> build(EpisodePlayerArgs args) async {
    return withTrace('episode_play', () async {
      final episodeRepo = ref.read(episodeRepositoryProvider);
      final videoSource = ref.read(videoSourceProvider);
      final episode = await episodeRepo.byId(args.episodeId);

      final url = await videoSource.playableUrl(
        seriesId: args.seriesId,
        episodeId: args.episodeId,
        storagePath: 'series/${args.seriesId}/episodes/${args.episodeId}.mp4',
      );

      final controller = BetterPlayerController(
        const BetterPlayerConfiguration(
          autoPlay: true,
          looping: false,
          aspectRatio: 9 / 16,
          fit: BoxFit.cover,
          controlsConfiguration: BetterPlayerControlsConfiguration(
            showControls: false,
          ),
        ),
      );
      await controller.setupDataSource(
        BetterPlayerDataSource.network(
          url,
          cacheConfiguration: const BetterPlayerCacheConfiguration(
            useCache: true,
          ),
        ),
      );

      return EpisodePlayerState(controller: controller, episode: episode);
    });
  }
}

final episodePlayerNotifierProvider = AsyncNotifierProvider.family<
    EpisodePlayerNotifier, EpisodePlayerState, EpisodePlayerArgs>(
  EpisodePlayerNotifier.new,
);
