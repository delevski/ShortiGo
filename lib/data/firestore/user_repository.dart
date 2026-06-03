import 'package:cloud_firestore/cloud_firestore.dart';

import '../../domain/entities/transaction.dart' as domain;
import '../../domain/entities/user.dart';
import '../../domain/interfaces/user_repository.dart';
import 'firestore_json.dart';

class FirestoreUserRepository implements UserRepository {
  FirestoreUserRepository(this._db);

  final FirebaseFirestore _db;

  @override
  Future<AppUser> byId(String id) async {
    final doc = await _db.collection('users').doc(id).get();
    if (!doc.exists) {
      throw StateError('User $id not found');
    }

    return AppUser.fromJson(firestoreJson(doc.data()!, id: doc.id));
  }

  @override
  Stream<AppUser> watch(String id) {
    return _db.collection('users').doc(id).snapshots().map((doc) {
      if (!doc.exists) {
        throw StateError('User $id not found');
      }

      return AppUser.fromJson(firestoreJson(doc.data()!, id: doc.id));
    });
  }

  @override
  Future<void> createIfMissing(AppUser user) async {
    final ref = _db.collection('users').doc(user.id);
    await ref.set(user.toJson(), SetOptions(merge: true));
  }

  @override
  Future<void> setDailyCheckIn(String userId, DateTime at) async {
    await _db.collection('users').doc(userId).update({
      'lastDailyCheckIn': Timestamp.fromDate(at),
    });
  }

  @override
  Future<void> saveSeries({
    required String userId,
    required String seriesId,
  }) async {
    await _db.collection('users').doc(userId).update({
      'favoriteSeriesIds': FieldValue.arrayUnion([seriesId]),
    });
  }

  @override
  Future<void> unsaveSeries({
    required String userId,
    required String seriesId,
  }) async {
    await _db.collection('users').doc(userId).update({
      'favoriteSeriesIds': FieldValue.arrayRemove([seriesId]),
    });
  }

  @override
  Future<void> grantDemoBonus({
    required String userId,
    required domain.TxType type,
    required int amount,
    required String reference,
    DateTime? dailyCheckInAt,
  }) async {
    final now = DateTime.now().toUtc();
    final userRef = _db.collection('users').doc(userId);
    final txRef = userRef.collection('transactions').doc();
    final batch = _db.batch();

    batch.update(userRef, {
      'bonus': FieldValue.increment(amount),
      if (dailyCheckInAt != null)
        'lastDailyCheckIn': dailyCheckInAt.toUtc().toIso8601String(),
    });
    batch.set(txRef, {
      'id': txRef.id,
      'userId': userId,
      'type': type.name,
      'coinsDelta': 0,
      'bonusDelta': amount,
      'reference': reference,
      'at': now.toIso8601String(),
    });

    await batch.commit();
  }
}
