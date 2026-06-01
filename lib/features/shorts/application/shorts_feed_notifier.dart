import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/perf/trace.dart';
import '../../../core/providers.dart';
import '../../../domain/entities/category.dart';
import '../../../domain/entities/episode.dart';
import '../../../domain/entities/series.dart';

class ShortsFeedState {
  const ShortsFeedState({
    this.episodes = const [],
    this.isLoading = false,
    this.error,
  });

  final List<Episode> episodes;
  final bool isLoading;
  final Object? error;
}

class ShortsFeedNotifier extends AsyncNotifier<ShortsFeedState> {
  @override
  Future<ShortsFeedState> build() async {
    return withTrace('shorts_load', () async {
      final seriesRepo = ref.read(seriesRepositoryProvider);
      final episodeRepo = ref.read(episodeRepositoryProvider);

      final List<Series> series = await seriesRepo.byCategory(
        Category.forYou,
        limit: 10,
      );
      if (series.isEmpty) {
        return const ShortsFeedState();
      }

      final lists = await Future.wait(
        series.map((item) => episodeRepo.bySeriesId(item.id)),
      );
      final episodes = <Episode>[];
      for (final list in lists) {
        episodes.addAll(list.take(3));
      }

      return ShortsFeedState(episodes: episodes);
    });
  }
}

final shortsFeedNotifierProvider =
    AsyncNotifierProvider<ShortsFeedNotifier, ShortsFeedState>(
  ShortsFeedNotifier.new,
);
