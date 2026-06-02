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
  testWidgets('logged-out protected routes land on onboarding preview', (
    tester,
  ) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          seriesRepositoryProvider.overrideWithValue(_FakeSeriesRepository()),
        ],
        child: ShortiGoApp(
          router: buildRouter(
            requireAuth: true,
            isLoggedIn: () => false,
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Preview ShortiGo'), findsOneWidget);
    expect(find.text('No previews yet'), findsOneWidget);
    expect(find.text('Sign in'), findsOneWidget);
  });
}
