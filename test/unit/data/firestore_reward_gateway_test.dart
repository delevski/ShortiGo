import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:fake_cloud_firestore/fake_cloud_firestore.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shortigo/data/rewards/firestore_reward_gateway.dart';

void main() {
  group('FirestoreRewardGateway', () {
    test('unlocks an affordable episode and decrements bonus', () async {
      final db = FakeFirebaseFirestore();
      await _seedUser(db, bonus: 62);
      await _seedEpisode(db, bonusUnlockCost: 60);

      await FirestoreRewardGateway(db: db, userId: 'u1')
          .unlockEpisode('episode-1');

      final user = await db.collection('users').doc('u1').get();
      expect(user.data()?['bonus'], 2);
      expect(user.data()?['unlockedEpisodeIds'], ['episode-1']);

      final transactions = await db
          .collection('users')
          .doc('u1')
          .collection('transactions')
          .get();
      expect(transactions.docs, hasLength(1));
      expect(transactions.docs.single.data()['type'], 'spend');
      expect(transactions.docs.single.data()['bonusDelta'], -60);
      expect(
        transactions.docs.single.data()['reference'],
        'episodeUnlock:episode-1',
      );
    });

    test('does not unlock when bonus is below the cost', () async {
      final db = FakeFirebaseFirestore();
      await _seedUser(db, bonus: 59);
      await _seedEpisode(db, bonusUnlockCost: 60);

      expect(
        () => FirestoreRewardGateway(db: db, userId: 'u1')
            .unlockEpisode('episode-1'),
        throwsA(isA<StateError>()),
      );

      final user = await db.collection('users').doc('u1').get();
      expect(user.data()?['bonus'], 59);
      expect(user.data()?['unlockedEpisodeIds'], isNull);
    });

    test('does not charge again for an already unlocked episode', () async {
      final db = FakeFirebaseFirestore();
      await _seedUser(db, bonus: 62, unlockedEpisodeIds: ['episode-1']);
      await _seedEpisode(db, bonusUnlockCost: 60);

      await FirestoreRewardGateway(db: db, userId: 'u1')
          .unlockEpisode('episode-1');

      final user = await db.collection('users').doc('u1').get();
      expect(user.data()?['bonus'], 62);
      expect(user.data()?['unlockedEpisodeIds'], ['episode-1']);

      final transactions = await db
          .collection('users')
          .doc('u1')
          .collection('transactions')
          .get();
      expect(transactions.docs, isEmpty);
    });
  });
}

Future<void> _seedUser(
  FirebaseFirestore db, {
  required int bonus,
  List<String>? unlockedEpisodeIds,
}) {
  return db.collection('users').doc('u1').set({
    'email': 'viewer@example.com',
    'createdAt': Timestamp.fromDate(DateTime.utc(2026, 6, 9)),
    'bonus': bonus,
    if (unlockedEpisodeIds != null) 'unlockedEpisodeIds': unlockedEpisodeIds,
  });
}

Future<void> _seedEpisode(
  FirebaseFirestore db, {
  required int bonusUnlockCost,
}) {
  return db.collection('episodes').doc('episode-1').set({
    'seriesId': 'series-1',
    'order': 1,
    'videoUrl': 'https://example.com/video.mp4',
    'thumbnailUrl': 'https://example.com/thumb.jpg',
    'durationSec': 60,
    'bonusUnlockCost': bonusUnlockCost,
  });
}
