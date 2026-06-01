import 'package:freezed_annotation/freezed_annotation.dart';

part 'transaction.freezed.dart';
part 'transaction.g.dart';

enum TxType { adReward, dailyCheckIn, purchase, spend, refund }

@freezed
abstract class Transaction with _$Transaction {
  const factory Transaction({
    required String id,
    required String userId,
    required TxType type,
    required int coinsDelta,
    required int bonusDelta,
    String? reference,
    required DateTime at,
  }) = _Transaction;

  factory Transaction.fromJson(Map<String, dynamic> json) =>
      _$TransactionFromJson(json);
}
