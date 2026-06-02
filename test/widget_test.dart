import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shortigo/app.dart';
import 'package:shortigo/core/providers.dart';
import 'package:shortigo/core/router/app_router.dart';
import 'package:shortigo/domain/entities/category.dart';
import 'package:shortigo/domain/entities/series.dart';
import 'package:shortigo/domain/interfaces/series_repository.dart';

class _FakeSeriesRepository implements SeriesRepository {
  @override
  Future<List<Series>> byCategory(Category category, {int limit = 20}) async {
    return const [];
  }

  @override
  Future<Series> byId(String id) {
    throw UnimplementedError();
  }

  @override
  Future<List<Series>> forYou({int limit = 20}) async {
    return const [];
  }
}

void main() {
  testWidgets('starts on Discover and navigates with bottom tabs', (
    tester,
  ) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          seriesRepositoryProvider.overrideWithValue(_FakeSeriesRepository()),
          currentAppUserDocProvider.overrideWith(
            (_) => Stream.value(null),
          ),
        ],
        child: ShortiGoApp(router: buildRouter()),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Discover'), findsWidgets);

    await tester.tap(find.text('Shorts'));
    await tester.pumpAndSettle();

    expect(find.text('Shorts'), findsWidgets);

    await tester.tap(find.text('My List'));
    await tester.pumpAndSettle();

    expect(find.text('My List'), findsWidgets);
    expect(find.text('No saved series yet'), findsOneWidget);

    await tester.tap(find.text('Profile'));
    await tester.pumpAndSettle();

    expect(find.text('Profile'), findsWidgets);
  });
}
