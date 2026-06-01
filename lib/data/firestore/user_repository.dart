import 'package:cloud_firestore/cloud_firestore.dart';

import '../../domain/entities/user.dart';
import '../../domain/interfaces/user_repository.dart';

class FirestoreUserRepository implements UserRepository {
  FirestoreUserRepository(this._db);

  final FirebaseFirestore _db;

  @override
  Future<AppUser> byId(String id) async {
    final doc = await _db.collection('users').doc(id).get();
    if (!doc.exists) {
      throw StateError('User $id not found');
    }

    return AppUser.fromJson({...doc.data()!, 'id': doc.id});
  }

  @override
  Stream<AppUser> watch(String id) {
    return _db.collection('users').doc(id).snapshots().map((doc) {
      if (!doc.exists) {
        throw StateError('User $id not found');
      }

      return AppUser.fromJson({...doc.data()!, 'id': doc.id});
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
}
