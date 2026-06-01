import 'package:flutter_test/flutter_test.dart';
import 'package:shortigo/domain/entities/category.dart';
import 'package:shortigo/domain/entities/series.dart';

void main() {
  group('Series', () {
    test('round-trips through JSON', () {
      final series = Series(
        id: 's1',
        title: 'My Three Beast Mates',
        coverUrl: 'https://example.com/cover.jpg',
        category: Category.adventure,
        isVip: true,
        episodeCount: 60,
        totalDurationSec: 5400,
        createdAt: DateTime.utc(2026, 1, 1),
        popularity: 100,
      );

      final json = series.toJson();
      final back = Series.fromJson(json);

      expect(back, equals(series));
    });

    test('isPublished defaults to true', () {
      final series = Series(
        id: 's1',
        title: 'X',
        coverUrl: 'u',
        category: Category.hot,
        createdAt: DateTime.utc(2026),
      );

      expect(series.isPublished, isTrue);
    });
  });
}
