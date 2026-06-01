import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/perf/trace.dart';
import '../../../core/providers.dart';
import '../../../domain/entities/category.dart';
import 'discover_state.dart';

class DiscoverNotifier extends AsyncNotifier<DiscoverState> {
  @override
  Future<DiscoverState> build() async {
    return withTrace('discover_load', () async {
      final repo = ref.read(seriesRepositoryProvider);
      final series = await repo.byCategory(Category.forYou);
      return DiscoverState(currentCategory: Category.forYou, series: series);
    });
  }

  Future<void> selectCategory(Category c) async {
    state = const AsyncLoading<DiscoverState>().copyWithPrevious(state);
    try {
      final repo = ref.read(seriesRepositoryProvider);
      final series = await repo.byCategory(c);
      state = AsyncData(DiscoverState(currentCategory: c, series: series));
    } catch (e, st) {
      state = AsyncError(e, st);
    }
  }
}

final discoverNotifierProvider =
    AsyncNotifierProvider<DiscoverNotifier, DiscoverState>(
  DiscoverNotifier.new,
);
