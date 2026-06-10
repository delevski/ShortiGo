import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/perf/trace.dart';
import '../../../core/providers.dart';
import '../../../domain/entities/category.dart';
import '../../../domain/entities/episode.dart';
import '../../../domain/entities/series.dart';
import '../../episode_player/application/episode_access.dart';

class ShortsFeedState {
  const ShortsFeedState({
    this.episodes = const [],
    this.seriesById = const {},
    this.isLoading = false,
    this.error,
  });

  final List<Episode> episodes;
  final Map<String, Series> seriesById;
  final bool isLoading;
  final Object? error;
}

class ShortsFeedNotifier extends AsyncNotifier<ShortsFeedState> {
  @override
  Future<ShortsFeedState> build() async {
    return withTrace('shorts_load', () async {
      final seriesRepo = ref.read(seriesRepositoryProvider);
      final episodeRepo = ref.read(episodeRepositoryProvider);
      final user = ref.watch(currentAppUserDocProvider).value;

      final List<Series> series = await seriesRepo.byCategory(
        Category.forYou,
        limit: 10,
      );
      if (series.isEmpty) {
        return const ShortsFeedState();
      }

      final seriesById = {for (final item in series) item.id: item};

      final lists = await Future.wait(
        series.map((item) => episodeRepo.bySeriesId(item.id)),
      );
      final episodes = <Episode>[];
      for (final list in lists) {
        episodes.addAll(
          list
              .where(
                (episode) =>
                    accessFor(episode, user) == EpisodeAccessState.open,
              )
              .take(3),
        );
      }

      return ShortsFeedState(episodes: episodes, seriesById: seriesById);
    });
  }
}

final shortsFeedNotifierProvider =
    AsyncNotifierProvider<ShortsFeedNotifier, ShortsFeedState>(
  ShortsFeedNotifier.new,
);
