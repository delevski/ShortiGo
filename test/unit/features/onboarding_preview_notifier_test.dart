import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:shortigo/core/providers.dart';
import 'package:shortigo/domain/entities/category.dart';
import 'package:shortigo/domain/entities/series.dart';
import 'package:shortigo/domain/interfaces/series_repository.dart';
import 'package:shortigo/features/onboarding/application/onboarding_preview_notifier.dart';

class _MockSeriesRepository extends Mock implements SeriesRepository {}

Series _series(String id, Category category) {
  return Series(
    id: id,
    title: 'Series $id',
    coverUrl: 'https://example.com/$id.jpg',
    category: category,
    createdAt: DateTime.utc(2026, 6, 2),
  );
}

void main() {
  late _MockSeriesRepository repo;
  late ProviderContainer container;

  setUp(() {
    repo = _MockSeriesRepository();
    container = ProviderContainer(
      overrides: [
        seriesRepositoryProvider.overrideWithValue(repo),
      ],
    );
    addTearDown(container.dispose);
  });

  test('loads For You preview series initially', () async {
    final series = [_series('s1', Category.forYou)];
    when(() => repo.byCategory(Category.forYou))
        .thenAnswer((_) async => series);

    final state =
        await container.read(onboardingPreviewNotifierProvider.future);

    expect(state.currentCategory, Category.forYou);
    expect(state.series, series);
  });

  test('selectCategory loads preview series for selected category', () async {
    when(() => repo.byCategory(Category.forYou)).thenAnswer((_) async => []);
    when(() => repo.byCategory(Category.hot)).thenAnswer(
      (_) async => [_series('hot', Category.hot)],
    );

    await container.read(onboardingPreviewNotifierProvider.future);
    await container
        .read(onboardingPreviewNotifierProvider.notifier)
        .selectCategory(Category.hot);

    final state =
        container.read(onboardingPreviewNotifierProvider).requireValue;
    expect(state.currentCategory, Category.hot);
    expect(state.series.single.id, 'hot');
  });
}
