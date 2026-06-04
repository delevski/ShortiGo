import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:fake_cloud_firestore/fake_cloud_firestore.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shortigo/data/firestore/series_repository.dart';
import 'package:shortigo/data/firestore/transaction_repository.dart';
import 'package:shortigo/data/firestore/user_repository.dart';
import 'package:shortigo/domain/entities/category.dart';
import 'package:shortigo/domain/entities/transaction.dart' as domain;

void main() {
  group('Firestore repositories', () {
    test('series maps Firestore Timestamp and category id data', () async {
      final db = FakeFirebaseFirestore();
      await db.collection('admin').doc('featured').set({
        'seriesIds': ['s1'],
      });
      await db.collection('series').doc('s1').set({
        'title': 'Seed Show',
        'description': 'Seeded from Firestore REST.',
        'coverUrl': 'https://example.com/cover.jpg',
        'category': 'new',
        'isVip': false,
        'episodeCount': 1,
        'totalDurationSec': 60,
        'createdAt': Timestamp.fromDate(DateTime.utc(2026, 6, 2)),
        'popularity': 10,
        'isPublished': true,
      });

      final repo = FirestoreSeriesRepository(db, featuredDocId: 'featured');

      final series = await repo.forYou();

      expect(series.single.id, 's1');
      expect(series.single.category, Category.newReleases);
      expect(series.single.createdAt, DateTime.utc(2026, 6, 2));
    });

    test('user maps nullable Firestore Timestamp fields', () async {
      final db = FakeFirebaseFirestore();
      await db.collection('users').doc('u1').set({
        'email': 'u@example.com',
        'createdAt': Timestamp.fromDate(DateTime.utc(2026, 6, 2)),
        'lastDailyCheckIn': Timestamp.fromDate(DateTime.utc(2026, 6, 3)),
      });

      final repo = FirestoreUserRepository(db);

      final user = await repo.byId('u1');

      expect(user.createdAt, DateTime.utc(2026, 6, 2));
      expect(user.lastDailyCheckIn, DateTime.utc(2026, 6, 3));
    });

    test('user can save and unsave favorite series IDs', () async {
      final db = FakeFirebaseFirestore();
      await db.collection('users').doc('u1').set({
        'email': 'u@example.com',
        'createdAt': Timestamp.fromDate(DateTime.utc(2026, 6, 2)),
        'favoriteSeriesIds': ['existing'],
      });

      final repo = FirestoreUserRepository(db);

      await repo.saveSeries(userId: 'u1', seriesId: 's1');
      await repo.saveSeries(userId: 'u1', seriesId: 's1');

      final saved = await repo.byId('u1');
      expect(saved.favoriteSeriesIds, ['existing', 's1']);

      await repo.unsaveSeries(userId: 'u1', seriesId: 's1');

      final unsaved = await repo.byId('u1');
      expect(unsaved.favoriteSeriesIds, ['existing']);
    });

    test('user deletion removes profile data but retains transaction ledger',
        () async {
      final db = FakeFirebaseFirestore();
      final user = db.collection('users').doc('u1');
      await user.set({
        'email': 'u@example.com',
        'createdAt': Timestamp.fromDate(DateTime.utc(2026, 6, 2)),
      });
      await user.collection('favorites').doc('s1').set({'saved': true});
      await user.collection('events').doc('e1').set({'type': 'watch'});
      await user.collection('transactions').doc('tx1').set({'type': 'spend'});

      await FirestoreUserRepository(db).deletePersonalData('u1');

      expect((await user.get()).exists, isFalse);
      expect((await user.collection('favorites').get()).docs, isEmpty);
      expect((await user.collection('events').get()).docs, isEmpty);
      expect((await user.collection('transactions').get()).docs, hasLength(1));
    });

    test('transactions map server timestamp ledger entries', () async {
      final db = FakeFirebaseFirestore();
      await db
          .collection('users')
          .doc('u1')
          .collection('transactions')
          .doc('tx1')
          .set({
        'userId': 'u1',
        'type': 'dailyCheckIn',
        'coinsDelta': 0,
        'bonusDelta': 5,
        'at': Timestamp.fromDate(DateTime.utc(2026, 6, 2)),
      });

      final repo = FirestoreTransactionRepository(db);

      final transactions = await repo.watchForUser('u1').first;

      expect(transactions.single.type, domain.TxType.dailyCheckIn);
      expect(transactions.single.at, DateTime.utc(2026, 6, 2));
    });
  });
}
