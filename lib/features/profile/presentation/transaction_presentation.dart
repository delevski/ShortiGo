import '../../../domain/entities/transaction.dart';

extension TransactionPresentation on Transaction {
  String get friendlyTitle {
    return switch (type) {
      TxType.adReward => 'Rewarded ad',
      TxType.dailyCheckIn => 'Daily check-in',
      TxType.purchase => 'Purchase',
      TxType.spend => 'Episode unlocked',
      TxType.refund => 'Refund',
    };
  }

  String get walletDeltaLabel {
    final value = bonusDelta != 0 ? bonusDelta : coinsDelta;
    final unit = bonusDelta != 0 ? 'bonus' : 'coins';
    return '${value > 0 ? '+' : ''}$value $unit';
  }
}
