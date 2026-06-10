import 'package:cloud_firestore/cloud_firestore.dart';

import '../../domain/interfaces/reward_gateway.dart';

class FirestoreRewardGateway implements RewardGateway {
  FirestoreRewardGateway({
    required FirebaseFirestore db,
    required String? userId,
  })  : _db = db,
        _userId = userId;

  final FirebaseFirestore _db;
  final String? _userId;

  @override
  Future<void> unlockEpisode(String episodeId) async {
    final userId = _userId;
    if (userId == null) {
      throw StateError('Sign in to unlock this episode.');
    }

    final userRef = _db.collection('users').doc(userId);
    final episodeRef = _db.collection('episodes').doc(episodeId);
    final txRef = userRef.collection('transactions').doc();

    await _db.runTransaction((transaction) async {
      final userDoc = await transaction.get(userRef);
      final episodeDoc = await transaction.get(episodeRef);
      if (!userDoc.exists) {
        throw StateError('Sign in to unlock this episode.');
      }
      if (!episodeDoc.exists) {
        throw StateError('Episode not found.');
      }

      final user = userDoc.data() ?? const <String, dynamic>{};
      final episode = episodeDoc.data() ?? const <String, dynamic>{};
      final rawUnlockedEpisodeIds = user['unlockedEpisodeIds'];
      final unlockedEpisodeIds = rawUnlockedEpisodeIds is Iterable
          ? List<String>.from(rawUnlockedEpisodeIds)
          : <String>[];
      if (unlockedEpisodeIds.contains(episodeId)) {
        return;
      }

      if (episode['isVipLocked'] == true) {
        throw StateError('This episode is VIP-only.');
      }

      final cost = episode['bonusUnlockCost'];
      if (cost is! int || cost <= 0) {
        throw StateError('This episode is not unlockable.');
      }

      final balance = user['bonus'] is int ? user['bonus'] as int : 0;
      if (balance < cost) {
        throw StateError('Not enough bonus to unlock this episode.');
      }

      final nextBalance = balance - cost;
      transaction.update(userRef, {
        'bonus': nextBalance,
        'unlockedEpisodeIds': [...unlockedEpisodeIds, episodeId],
      });
      transaction.set(txRef, {
        'id': txRef.id,
        'userId': userId,
        'type': 'spend',
        'coinsDelta': 0,
        'bonusDelta': -cost,
        'reference': 'episodeUnlock:$episodeId',
        'at': DateTime.now().toUtc().toIso8601String(),
      });
    });
  }
}
