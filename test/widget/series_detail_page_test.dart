import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:mocktail/mocktail.dart';
import 'package:shortigo/core/providers.dart';
import 'package:shortigo/domain/entities/category.dart';
import 'package:shortigo/domain/entities/episode.dart';
import 'package:shortigo/domain/entities/series.dart';
import 'package:shortigo/domain/entities/user.dart';
import 'package:shortigo/domain/interfaces/episode_repository.dart';
import 'package:shortigo/domain/interfaces/series_repository.dart';
import 'package:shortigo/domain/interfaces/user_repository.dart';
import 'package:shortigo/features/series_detail/presentation/series_detail_page.dart';

class _MockUserRepository extends Mock implements UserRepository {}

class _FakeSeriesRepository implements SeriesRepository {
  @override
  Future<List<Series>> byCategory(Category category, {int limit = 20}) async {
    return const [];
  }

  @override
  Future<Series> byId(String id) async {
    return Series(
      id: id,
      title: 'Save Me',
      description: 'A series worth saving.',
      coverUrl: 'https://example.com/cover.jpg',
      category: Category.adventure,
      episodeCount: 1,
      createdAt: DateTime.utc(2026, 6, 2),
    );
  }

  @override
  Future<List<Series>> forYou({int limit = 20}) async {
    return const [];
  }
}

class _FakeEpisodeRepository implements EpisodeRepository {
  @override
  Future<Episode> byId(String id) {
    throw UnimplementedError();
  }

  @override
  Future<List<Episode>> bySeriesId(String seriesId) async {
    return const [];
  }
}

AppUser _user({List<String> favoriteSeriesIds = const []}) {
  return AppUser(
    id: 'u1',
    email: 'u@example.com',
    favoriteSeriesIds: favoriteSeriesIds,
    createdAt: DateTime.utc(2026, 6, 2),
  );
}

Future<void> _pumpPage(
  WidgetTester tester, {
  required AppUser? user,
  required UserRepository userRepository,
}) async {
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        seriesRepositoryProvider.overrideWithValue(_FakeSeriesRepository()),
        episodeRepositoryProvider.overrideWithValue(_FakeEpisodeRepository()),
        userRepositoryProvider.overrideWithValue(userRepository),
        currentAppUserDocProvider.overrideWith((_) => Stream.value(user)),
      ],
      child: const MaterialApp(
        home: SeriesDetailPage(seriesId: 's1'),
      ),
    ),
  );
  await tester.pumpAndSettle();
}

Future<void> _pumpRoutedPage(
  WidgetTester tester, {
  required AppUser? user,
  required UserRepository userRepository,
}) async {
  final router = GoRouter(
    initialLocation: '/series/s1',
    routes: [
      GoRoute(
        path: '/series/:id',
        builder: (_, state) {
          return SeriesDetailPage(seriesId: state.pathParameters['id']!);
        },
      ),
      GoRoute(
        path: '/login',
        builder: (_, __) => const Scaffold(body: Text('Login screen')),
      ),
    ],
  );

  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        seriesRepositoryProvider.overrideWithValue(_FakeSeriesRepository()),
        episodeRepositoryProvider.overrideWithValue(_FakeEpisodeRepository()),
        userRepositoryProvider.overrideWithValue(userRepository),
        currentAppUserDocProvider.overrideWith((_) => Stream.value(user)),
      ],
      child: MaterialApp.router(routerConfig: router),
    ),
  );
  await tester.pumpAndSettle();
}

void main() {
  testWidgets('saves an unsaved series for the signed-in user', (tester) async {
    final userRepository = _MockUserRepository();
    when(
      () => userRepository.saveSeries(userId: 'u1', seriesId: 's1'),
    ).thenAnswer((_) async {});

    await _pumpPage(
      tester,
      user: _user(),
      userRepository: userRepository,
    );

    expect(find.text('Save'), findsOneWidget);

    await tester.tap(find.text('Save'));
    await tester.pump();

    verify(
      () => userRepository.saveSeries(userId: 'u1', seriesId: 's1'),
    ).called(1);
  });

  testWidgets('unsaves a saved series for the signed-in user', (tester) async {
    final userRepository = _MockUserRepository();
    when(
      () => userRepository.unsaveSeries(userId: 'u1', seriesId: 's1'),
    ).thenAnswer((_) async {});

    await _pumpPage(
      tester,
      user: _user(favoriteSeriesIds: ['s1']),
      userRepository: userRepository,
    );

    expect(find.text('Saved'), findsOneWidget);

    await tester.tap(find.text('Saved'));
    await tester.pump();

    verify(
      () => userRepository.unsaveSeries(userId: 'u1', seriesId: 's1'),
    ).called(1);
  });

  testWidgets('routes signed-out save attempts to login', (tester) async {
    final userRepository = _MockUserRepository();

    await _pumpRoutedPage(
      tester,
      user: null,
      userRepository: userRepository,
    );

    expect(find.text('Save'), findsOneWidget);

    await tester.tap(find.text('Save'));
    await tester.pumpAndSettle();

    expect(find.text('Login screen'), findsOneWidget);
  });
}
