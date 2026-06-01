import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:shortigo/core/providers.dart';
import 'package:shortigo/domain/entities/category.dart';
import 'package:shortigo/domain/entities/series.dart';
import 'package:shortigo/domain/interfaces/series_repository.dart';
import 'package:shortigo/features/discover/application/discover_notifier.dart';

class _MockSeriesRepository extends Mock implements SeriesRepository {}

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

  test('build() returns For You series from repo', () async {
    final series = Series(
      id: 's1',
      title: 'X',
      coverUrl: 'u',
      category: Category.forYou,
      createdAt: DateTime.utc(2026),
    );
    when(() => repo.byCategory(Category.forYou)).thenAnswer(
      (_) async => [series],
    );

    final state = await container.read(discoverNotifierProvider.future);

    expect(state.currentCategory, Category.forYou);
    expect(state.series, [series]);
  });

  test('selectCategory loads new series', () async {
    when(() => repo.byCategory(Category.forYou)).thenAnswer((_) async => []);
    when(() => repo.byCategory(Category.hot)).thenAnswer(
      (_) async => [
        Series(
          id: 's2',
          title: 'Hot',
          coverUrl: 'u',
          category: Category.hot,
          createdAt: DateTime.utc(2026),
        ),
      ],
    );

    await container.read(discoverNotifierProvider.future);
    await container
        .read(discoverNotifierProvider.notifier)
        .selectCategory(Category.hot);
    final state = container.read(discoverNotifierProvider).requireValue;

    expect(state.currentCategory, Category.hot);
    expect(state.series.first.id, 's2');
  });
}
