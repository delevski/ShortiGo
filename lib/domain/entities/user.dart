import 'package:freezed_annotation/freezed_annotation.dart';

part 'user.freezed.dart';
part 'user.g.dart';

@freezed
abstract class AppUser with _$AppUser {
  const factory AppUser({
    required String id,
    required String email,
    String? displayName,
    String? photoUrl,
    @Default(false) bool isVip,
    DateTime? vipExpiresAt,
    @Default(0) int coins,
    @Default(0) int bonus,
    @Default(<String>[]) List<String> favoriteSeriesIds,
    @Default(<String>[]) List<String> unlockedEpisodeIds,
    DateTime? lastDailyCheckIn,
    required DateTime createdAt,
  }) = _AppUser;

  factory AppUser.fromJson(Map<String, dynamic> json) =>
      _$AppUserFromJson(json);
}
