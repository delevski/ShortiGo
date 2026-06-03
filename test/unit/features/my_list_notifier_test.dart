import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:shortigo/core/providers.dart';
import 'package:shortigo/domain/entities/category.dart';
import 'package:shortigo/domain/entities/series.dart';
import 'package:shortigo/domain/entities/user.dart';
import 'package:shortigo/domain/interfaces/series_repository.dart';
import 'package:shortigo/features/my_list/application/my_list_notifier.dart';

class _MockSeriesRepository extends Mock implements SeriesRepository {}

Series _series(String id) {
  return Series(
    id: id,
    title: 'Series $id',
    coverUrl: 'https://example.com/$id.jpg',
    category: Category.newReleases,
    createdAt: DateTime.utc(2026, 6, 2),
  );
}

AppUser _user(List<String> favoriteSeriesIds) {
  return AppUser(
    id: 'u1',
    email: 'u@example.com',
    favoriteSeriesIds: favoriteSeriesIds,
    createdAt: DateTime.utc(2026, 6, 2),
  );
}

ProviderContainer _container({
  required _MockSeriesRepository repo,
  required AsyncValue<AppUser?> user,
}) {
  return ProviderContainer(
    overrides: [
      seriesRepositoryProvider.overrideWithValue(repo),
      currentAppUserDocProvider.overrideWith((_) => Stream.value(user.value)),
    ],
  );
}

void main() {
  late _MockSeriesRepository repo;

  setUp(() {
    repo = _MockSeriesRepository();
  });

  test('marks the screen as requiring sign-in when there is no app user',
      () async {
    final container = _container(repo: repo, user: const AsyncData(null));
    addTearDown(container.dispose);

    final state = await container.read(myListNotifierProvider.future);

    expect(state.series, isEmpty);
    expect(state.requiresSignIn, isTrue);
    verifyNever(() => repo.byId(any()));
  });

  test('returns an empty list when user has no saved series', () async {
    final container = _container(repo: repo, user: AsyncData(_user([])));
    addTearDown(container.dispose);

    final state = await container.read(myListNotifierProvider.future);

    expect(state.series, isEmpty);
    expect(state.requiresSignIn, isFalse);
    verifyNever(() => repo.byId(any()));
  });

  test('resolves saved series in favoriteSeriesIds order', () async {
    when(() => repo.byId('s2')).thenAnswer((_) async => _series('s2'));
    when(() => repo.byId('s1')).thenAnswer((_) async => _series('s1'));
    final container = _container(
      repo: repo,
      user: AsyncData(_user(['s2', 's1'])),
    );
    addTearDown(container.dispose);

    final state = await container.read(myListNotifierProvider.future);

    expect(state.series.map((series) => series.id), ['s2', 's1']);
    verify(() => repo.byId('s2')).called(1);
    verify(() => repo.byId('s1')).called(1);
  });
}
