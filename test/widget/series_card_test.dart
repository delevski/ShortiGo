import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shortigo/domain/entities/category.dart';
import 'package:shortigo/domain/entities/series.dart';
import 'package:shortigo/features/discover/presentation/series_card.dart';

void main() {
  testWidgets('SeriesCard shows title and EP count', (tester) async {
    var tapped = false;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SizedBox(
            width: 200,
            height: 200,
            child: SeriesCard(
              series: Series(
                id: 's1',
                title: 'My Show',
                coverUrl: 'https://x/c.jpg',
                category: Category.adventure,
                episodeCount: 21,
                createdAt: DateTime.utc(2026),
              ),
              onTap: () => tapped = true,
            ),
          ),
        ),
      ),
    );

    expect(find.text('My Show'), findsOneWidget);
    expect(find.text('21 EP'), findsOneWidget);

    await tester.tap(find.byType(SeriesCard));

    expect(tapped, isTrue);
  });
}
