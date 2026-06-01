import 'package:flutter_test/flutter_test.dart';
import 'package:shortigo/domain/entities/transaction.dart';

void main() {
  test('Transaction round-trips', () {
    final transaction = Transaction(
      id: 'tx1',
      userId: 'u1',
      type: TxType.adReward,
      coinsDelta: 0,
      bonusDelta: 12,
      reference: 'ad_unit_1',
      at: DateTime.utc(2026, 1, 1, 13),
    );

    expect(
      Transaction.fromJson(transaction.toJson()),
      equals(transaction),
    );
  });
}
