import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers.dart';
import '../../../domain/entities/episode.dart';
import '../../../domain/entities/series.dart';

class SeriesDetailState {
  const SeriesDetailState({
    this.series,
    this.episodes = const [],
    this.isLoading = false,
    this.error,
  });

  final Series? series;
  final List<Episode> episodes;
  final bool isLoading;
  final Object? error;
}

class SeriesDetailNotifier
    extends FamilyAsyncNotifier<SeriesDetailState, String> {
  @override
  Future<SeriesDetailState> build(String seriesId) async {
    final seriesRepo = ref.read(seriesRepositoryProvider);
    final episodeRepo = ref.read(episodeRepositoryProvider);

    final series = await seriesRepo.byId(seriesId);
    final episodes = await episodeRepo.bySeriesId(seriesId);

    return SeriesDetailState(series: series, episodes: episodes);
  }
}

final seriesDetailNotifierProvider = AsyncNotifierProvider.family<
    SeriesDetailNotifier, SeriesDetailState, String>(
  SeriesDetailNotifier.new,
);
