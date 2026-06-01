// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_AppUser _$AppUserFromJson(Map<String, dynamic> json) => _AppUser(
      id: json['id'] as String,
      email: json['email'] as String,
      displayName: json['displayName'] as String?,
      photoUrl: json['photoUrl'] as String?,
      isVip: json['isVip'] as bool? ?? false,
      vipExpiresAt: json['vipExpiresAt'] == null
          ? null
          : DateTime.parse(json['vipExpiresAt'] as String),
      coins: (json['coins'] as num?)?.toInt() ?? 0,
      bonus: (json['bonus'] as num?)?.toInt() ?? 0,
      favoriteSeriesIds: (json['favoriteSeriesIds'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const <String>[],
      lastDailyCheckIn: json['lastDailyCheckIn'] == null
          ? null
          : DateTime.parse(json['lastDailyCheckIn'] as String),
      createdAt: DateTime.parse(json['createdAt'] as String),
    );

Map<String, dynamic> _$AppUserToJson(_AppUser instance) => <String, dynamic>{
      'id': instance.id,
      'email': instance.email,
      'displayName': instance.displayName,
      'photoUrl': instance.photoUrl,
      'isVip': instance.isVip,
      'vipExpiresAt': instance.vipExpiresAt?.toIso8601String(),
      'coins': instance.coins,
      'bonus': instance.bonus,
      'favoriteSeriesIds': instance.favoriteSeriesIds,
      'lastDailyCheckIn': instance.lastDailyCheckIn?.toIso8601String(),
      'createdAt': instance.createdAt.toIso8601String(),
    };
