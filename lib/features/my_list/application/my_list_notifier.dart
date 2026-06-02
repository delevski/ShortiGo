import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers.dart';
import '../../../domain/entities/series.dart';

class MyListState {
  const MyListState({
    this.series = const [],
  });

  final List<Series> series;
}

class MyListNotifier extends AsyncNotifier<MyListState> {
  @override
  Future<MyListState> build() async {
    final user = await ref.watch(currentAppUserDocProvider.future);
    final favoriteSeriesIds = user?.favoriteSeriesIds ?? const <String>[];
    if (favoriteSeriesIds.isEmpty) {
      return const MyListState();
    }

    final repo = ref.read(seriesRepositoryProvider);
    final series = <Series>[];
    for (final id in favoriteSeriesIds) {
      final saved = await repo.byId(id);
      if (saved.isPublished) {
        series.add(saved);
      }
    }

    return MyListState(series: series);
  }
}

final myListNotifierProvider =
    AsyncNotifierProvider<MyListNotifier, MyListState>(
  MyListNotifier.new,
);
