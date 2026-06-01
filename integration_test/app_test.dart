import 'package:fake_cloud_firestore/fake_cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shortigo/app.dart';
import 'package:shortigo/core/providers.dart';
import 'package:shortigo/core/router/app_router.dart';

void main() {
  testWidgets('cold start navigates to discover', (tester) async {
    final fakeFirestore = FakeFirebaseFirestore();

    await fakeFirestore.collection('series').doc('s1').set({
      'id': 's1',
      'title': 'Test',
      'coverUrl': 'https://x/c.jpg',
      'category': 'forYou',
      'isVip': false,
      'episodeCount': 1,
      'totalDurationSec': 60,
      'createdAt': DateTime.now().toUtc().toIso8601String(),
      'popularity': 1,
      'isPublished': true,
    });
    await fakeFirestore.collection('admin').doc('featured').set({
      'seriesIds': ['s1'],
    });

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          firestoreProvider.overrideWithValue(fakeFirestore),
        ],
        child: ShortiGoApp(router: buildRouter()),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Discover'), findsWidgets);
  });
}
