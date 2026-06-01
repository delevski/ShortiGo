// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'transaction.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_Transaction _$TransactionFromJson(Map<String, dynamic> json) => _Transaction(
      id: json['id'] as String,
      userId: json['userId'] as String,
      type: $enumDecode(_$TxTypeEnumMap, json['type']),
      coinsDelta: (json['coinsDelta'] as num).toInt(),
      bonusDelta: (json['bonusDelta'] as num).toInt(),
      reference: json['reference'] as String?,
      at: DateTime.parse(json['at'] as String),
    );

Map<String, dynamic> _$TransactionToJson(_Transaction instance) =>
    <String, dynamic>{
      'id': instance.id,
      'userId': instance.userId,
      'type': _$TxTypeEnumMap[instance.type]!,
      'coinsDelta': instance.coinsDelta,
      'bonusDelta': instance.bonusDelta,
      'reference': instance.reference,
      'at': instance.at.toIso8601String(),
    };

const _$TxTypeEnumMap = {
  TxType.adReward: 'adReward',
  TxType.purchase: 'purchase',
  TxType.spend: 'spend',
  TxType.refund: 'refund',
};
