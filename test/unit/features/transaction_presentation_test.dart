import 'package:flutter_test/flutter_test.dart';
import 'package:shortigo/domain/entities/transaction.dart';
import 'package:shortigo/features/profile/presentation/transaction_presentation.dart';

void main() {
  test('spending is shown as a negative wallet movement', () {
    final transaction = Transaction(
      id: 'tx-1',
      userId: 'user-1',
      type: TxType.spend,
      coinsDelta: 0,
      bonusDelta: -60,
      at: DateTime.utc(2026, 6, 4),
    );

    expect(transaction.walletDeltaLabel, '-60 bonus');
    expect(transaction.friendlyTitle, 'Episode unlocked');
  });

  test('rewards are shown as positive wallet movements', () {
    final transaction = Transaction(
      id: 'tx-1',
      userId: 'user-1',
      type: TxType.adReward,
      coinsDelta: 0,
      bonusDelta: 12,
      at: DateTime.utc(2026, 6, 4),
    );

    expect(transaction.walletDeltaLabel, '+12 bonus');
    expect(transaction.friendlyTitle, 'Rewarded ad');
  });
}
