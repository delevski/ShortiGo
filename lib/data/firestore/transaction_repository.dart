import 'package:cloud_firestore/cloud_firestore.dart' hide Transaction;

import '../../domain/entities/transaction.dart';
import '../../domain/interfaces/transaction_repository.dart';

class FirestoreTransactionRepository implements TransactionRepository {
  FirestoreTransactionRepository(this._db);

  final FirebaseFirestore _db;

  @override
  Stream<List<Transaction>> watchForUser(String userId, {int limit = 50}) {
    return _db
        .collection('users')
        .doc(userId)
        .collection('transactions')
        .orderBy('at', descending: true)
        .limit(limit)
        .snapshots()
        .map(
          (snap) => snap.docs
              .map((doc) => Transaction.fromJson({...doc.data(), 'id': doc.id}))
              .toList(),
        );
  }
}
