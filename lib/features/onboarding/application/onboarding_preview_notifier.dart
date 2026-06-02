import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers.dart';
import '../../../domain/entities/category.dart';
import '../../../domain/entities/series.dart';

class OnboardingPreviewState {
  const OnboardingPreviewState({
    this.currentCategory = Category.forYou,
    this.series = const [],
  });

  final Category currentCategory;
  final List<Series> series;
}

class OnboardingPreviewNotifier extends AsyncNotifier<OnboardingPreviewState> {
  @override
  Future<OnboardingPreviewState> build() async {
    final repo = ref.read(seriesRepositoryProvider);
    final series = await repo.byCategory(Category.forYou);
    return OnboardingPreviewState(series: series);
  }

  Future<void> selectCategory(Category category) async {
    state =
        const AsyncLoading<OnboardingPreviewState>().copyWithPrevious(state);
    try {
      final repo = ref.read(seriesRepositoryProvider);
      final series = await repo.byCategory(category);
      state = AsyncData(
        OnboardingPreviewState(
          currentCategory: category,
          series: series,
        ),
      );
    } catch (error, stackTrace) {
      state = AsyncError(error, stackTrace);
    }
  }
}

final onboardingPreviewNotifierProvider =
    AsyncNotifierProvider<OnboardingPreviewNotifier, OnboardingPreviewState>(
  OnboardingPreviewNotifier.new,
);
