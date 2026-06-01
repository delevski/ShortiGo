import '../../domain/entities/transaction.dart';

abstract class TransactionRepository {
  Stream<List<Transaction>> watchForUser(String userId, {int limit = 50});
}
