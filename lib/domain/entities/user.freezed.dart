// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'user.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$AppUser {
  String get id;
  String get email;
  String? get displayName;
  String? get photoUrl;
  bool get isVip;
  DateTime? get vipExpiresAt;
  int get coins;
  int get bonus;
  List<String> get favoriteSeriesIds;
  List<String> get unlockedEpisodeIds;
  DateTime? get lastDailyCheckIn;
  DateTime get createdAt;

  /// Create a copy of AppUser
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  $AppUserCopyWith<AppUser> get copyWith =>
      _$AppUserCopyWithImpl<AppUser>(this as AppUser, _$identity);

  /// Serializes this AppUser to a JSON map.
  Map<String, dynamic> toJson();

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is AppUser &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.email, email) || other.email == email) &&
            (identical(other.displayName, displayName) ||
                other.displayName == displayName) &&
            (identical(other.photoUrl, photoUrl) ||
                other.photoUrl == photoUrl) &&
            (identical(other.isVip, isVip) || other.isVip == isVip) &&
            (identical(other.vipExpiresAt, vipExpiresAt) ||
                other.vipExpiresAt == vipExpiresAt) &&
            (identical(other.coins, coins) || other.coins == coins) &&
            (identical(other.bonus, bonus) || other.bonus == bonus) &&
            const DeepCollectionEquality()
                .equals(other.favoriteSeriesIds, favoriteSeriesIds) &&
            const DeepCollectionEquality()
                .equals(other.unlockedEpisodeIds, unlockedEpisodeIds) &&
            (identical(other.lastDailyCheckIn, lastDailyCheckIn) ||
                other.lastDailyCheckIn == lastDailyCheckIn) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      email,
      displayName,
      photoUrl,
      isVip,
      vipExpiresAt,
      coins,
      bonus,
      const DeepCollectionEquality().hash(favoriteSeriesIds),
      const DeepCollectionEquality().hash(unlockedEpisodeIds),
      lastDailyCheckIn,
      createdAt);

  @override
  String toString() {
    return 'AppUser(id: $id, email: $email, displayName: $displayName, photoUrl: $photoUrl, isVip: $isVip, vipExpiresAt: $vipExpiresAt, coins: $coins, bonus: $bonus, favoriteSeriesIds: $favoriteSeriesIds, unlockedEpisodeIds: $unlockedEpisodeIds, lastDailyCheckIn: $lastDailyCheckIn, createdAt: $createdAt)';
  }
}

/// @nodoc
abstract mixin class $AppUserCopyWith<$Res> {
  factory $AppUserCopyWith(AppUser value, $Res Function(AppUser) _then) =
      _$AppUserCopyWithImpl;
  @useResult
  $Res call(
      {String id,
      String email,
      String? displayName,
      String? photoUrl,
      bool isVip,
      DateTime? vipExpiresAt,
      int coins,
      int bonus,
      List<String> favoriteSeriesIds,
      List<String> unlockedEpisodeIds,
      DateTime? lastDailyCheckIn,
      DateTime createdAt});
}

/// @nodoc
class _$AppUserCopyWithImpl<$Res> implements $AppUserCopyWith<$Res> {
  _$AppUserCopyWithImpl(this._self, this._then);

  final AppUser _self;
  final $Res Function(AppUser) _then;

  /// Create a copy of AppUser
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? email = null,
    Object? displayName = freezed,
    Object? photoUrl = freezed,
    Object? isVip = null,
    Object? vipExpiresAt = freezed,
    Object? coins = null,
    Object? bonus = null,
    Object? favoriteSeriesIds = null,
    Object? unlockedEpisodeIds = null,
    Object? lastDailyCheckIn = freezed,
    Object? createdAt = null,
  }) {
    return _then(_self.copyWith(
      id: null == id
          ? _self.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      email: null == email
          ? _self.email
          : email // ignore: cast_nullable_to_non_nullable
              as String,
      displayName: freezed == displayName
          ? _self.displayName
          : displayName // ignore: cast_nullable_to_non_nullable
              as String?,
      photoUrl: freezed == photoUrl
          ? _self.photoUrl
          : photoUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      isVip: null == isVip
          ? _self.isVip
          : isVip // ignore: cast_nullable_to_non_nullable
              as bool,
      vipExpiresAt: freezed == vipExpiresAt
          ? _self.vipExpiresAt
          : vipExpiresAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      coins: null == coins
          ? _self.coins
          : coins // ignore: cast_nullable_to_non_nullable
              as int,
      bonus: null == bonus
          ? _self.bonus
          : bonus // ignore: cast_nullable_to_non_nullable
              as int,
      favoriteSeriesIds: null == favoriteSeriesIds
          ? _self.favoriteSeriesIds
          : favoriteSeriesIds // ignore: cast_nullable_to_non_nullable
              as List<String>,
      unlockedEpisodeIds: null == unlockedEpisodeIds
          ? _self.unlockedEpisodeIds
          : unlockedEpisodeIds // ignore: cast_nullable_to_non_nullable
              as List<String>,
      lastDailyCheckIn: freezed == lastDailyCheckIn
          ? _self.lastDailyCheckIn
          : lastDailyCheckIn // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      createdAt: null == createdAt
          ? _self.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
    ));
  }
}

/// Adds pattern-matching-related methods to [AppUser].
extension AppUserPatterns on AppUser {
  /// A variant of `map` that fallback to returning `orElse`.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case _:
  ///     return orElse();
  /// }
  /// ```

  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>(
    TResult Function(_AppUser value)? $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _AppUser() when $default != null:
        return $default(_that);
      case _:
        return orElse();
    }
  }

  /// A `switch`-like method, using callbacks.
  ///
  /// Callbacks receives the raw object, upcasted.
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case final Subclass2 value:
  ///     return ...;
  /// }
  /// ```

  @optionalTypeArgs
  TResult map<TResult extends Object?>(
    TResult Function(_AppUser value) $default,
  ) {
    final _that = this;
    switch (_that) {
      case _AppUser():
        return $default(_that);
      case _:
        throw StateError('Unexpected subclass');
    }
  }

  /// A variant of `map` that fallback to returning `null`.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case _:
  ///     return null;
  /// }
  /// ```

  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>(
    TResult? Function(_AppUser value)? $default,
  ) {
    final _that = this;
    switch (_that) {
      case _AppUser() when $default != null:
        return $default(_that);
      case _:
        return null;
    }
  }

  /// A variant of `when` that fallback to an `orElse` callback.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case _:
  ///     return orElse();
  /// }
  /// ```

  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>(
    TResult Function(
            String id,
            String email,
            String? displayName,
            String? photoUrl,
            bool isVip,
            DateTime? vipExpiresAt,
            int coins,
            int bonus,
            List<String> favoriteSeriesIds,
            List<String> unlockedEpisodeIds,
            DateTime? lastDailyCheckIn,
            DateTime createdAt)?
        $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _AppUser() when $default != null:
        return $default(
            _that.id,
            _that.email,
            _that.displayName,
            _that.photoUrl,
            _that.isVip,
            _that.vipExpiresAt,
            _that.coins,
            _that.bonus,
            _that.favoriteSeriesIds,
            _that.unlockedEpisodeIds,
            _that.lastDailyCheckIn,
            _that.createdAt);
      case _:
        return orElse();
    }
  }

  /// A `switch`-like method, using callbacks.
  ///
  /// As opposed to `map`, this offers destructuring.
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case Subclass2(:final field2):
  ///     return ...;
  /// }
  /// ```

  @optionalTypeArgs
  TResult when<TResult extends Object?>(
    TResult Function(
            String id,
            String email,
            String? displayName,
            String? photoUrl,
            bool isVip,
            DateTime? vipExpiresAt,
            int coins,
            int bonus,
            List<String> favoriteSeriesIds,
            List<String> unlockedEpisodeIds,
            DateTime? lastDailyCheckIn,
            DateTime createdAt)
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _AppUser():
        return $default(
            _that.id,
            _that.email,
            _that.displayName,
            _that.photoUrl,
            _that.isVip,
            _that.vipExpiresAt,
            _that.coins,
            _that.bonus,
            _that.favoriteSeriesIds,
            _that.unlockedEpisodeIds,
            _that.lastDailyCheckIn,
            _that.createdAt);
      case _:
        throw StateError('Unexpected subclass');
    }
  }

  /// A variant of `when` that fallback to returning `null`
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case _:
  ///     return null;
  /// }
  /// ```

  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>(
    TResult? Function(
            String id,
            String email,
            String? displayName,
            String? photoUrl,
            bool isVip,
            DateTime? vipExpiresAt,
            int coins,
            int bonus,
            List<String> favoriteSeriesIds,
            List<String> unlockedEpisodeIds,
            DateTime? lastDailyCheckIn,
            DateTime createdAt)?
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _AppUser() when $default != null:
        return $default(
            _that.id,
            _that.email,
            _that.displayName,
            _that.photoUrl,
            _that.isVip,
            _that.vipExpiresAt,
            _that.coins,
            _that.bonus,
            _that.favoriteSeriesIds,
            _that.unlockedEpisodeIds,
            _that.lastDailyCheckIn,
            _that.createdAt);
      case _:
        return null;
    }
  }
}

/// @nodoc
@JsonSerializable()
class _AppUser implements AppUser {
  const _AppUser(
      {required this.id,
      required this.email,
      this.displayName,
      this.photoUrl,
      this.isVip = false,
      this.vipExpiresAt,
      this.coins = 0,
      this.bonus = 0,
      final List<String> favoriteSeriesIds = const <String>[],
      final List<String> unlockedEpisodeIds = const <String>[],
      this.lastDailyCheckIn,
      required this.createdAt})
      : _favoriteSeriesIds = favoriteSeriesIds,
        _unlockedEpisodeIds = unlockedEpisodeIds;
  factory _AppUser.fromJson(Map<String, dynamic> json) =>
      _$AppUserFromJson(json);

  @override
  final String id;
  @override
  final String email;
  @override
  final String? displayName;
  @override
  final String? photoUrl;
  @override
  @JsonKey()
  final bool isVip;
  @override
  final DateTime? vipExpiresAt;
  @override
  @JsonKey()
  final int coins;
  @override
  @JsonKey()
  final int bonus;
  final List<String> _favoriteSeriesIds;
  @override
  @JsonKey()
  List<String> get favoriteSeriesIds {
    if (_favoriteSeriesIds is EqualUnmodifiableListView)
      return _favoriteSeriesIds;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_favoriteSeriesIds);
  }

  final List<String> _unlockedEpisodeIds;
  @override
  @JsonKey()
  List<String> get unlockedEpisodeIds {
    if (_unlockedEpisodeIds is EqualUnmodifiableListView)
      return _unlockedEpisodeIds;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_unlockedEpisodeIds);
  }

  @override
  final DateTime? lastDailyCheckIn;
  @override
  final DateTime createdAt;

  /// Create a copy of AppUser
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  _$AppUserCopyWith<_AppUser> get copyWith =>
      __$AppUserCopyWithImpl<_AppUser>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$AppUserToJson(
      this,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _AppUser &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.email, email) || other.email == email) &&
            (identical(other.displayName, displayName) ||
                other.displayName == displayName) &&
            (identical(other.photoUrl, photoUrl) ||
                other.photoUrl == photoUrl) &&
            (identical(other.isVip, isVip) || other.isVip == isVip) &&
            (identical(other.vipExpiresAt, vipExpiresAt) ||
                other.vipExpiresAt == vipExpiresAt) &&
            (identical(other.coins, coins) || other.coins == coins) &&
            (identical(other.bonus, bonus) || other.bonus == bonus) &&
            const DeepCollectionEquality()
                .equals(other._favoriteSeriesIds, _favoriteSeriesIds) &&
            const DeepCollectionEquality()
                .equals(other._unlockedEpisodeIds, _unlockedEpisodeIds) &&
            (identical(other.lastDailyCheckIn, lastDailyCheckIn) ||
                other.lastDailyCheckIn == lastDailyCheckIn) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      email,
      displayName,
      photoUrl,
      isVip,
      vipExpiresAt,
      coins,
      bonus,
      const DeepCollectionEquality().hash(_favoriteSeriesIds),
      const DeepCollectionEquality().hash(_unlockedEpisodeIds),
      lastDailyCheckIn,
      createdAt);

  @override
  String toString() {
    return 'AppUser(id: $id, email: $email, displayName: $displayName, photoUrl: $photoUrl, isVip: $isVip, vipExpiresAt: $vipExpiresAt, coins: $coins, bonus: $bonus, favoriteSeriesIds: $favoriteSeriesIds, unlockedEpisodeIds: $unlockedEpisodeIds, lastDailyCheckIn: $lastDailyCheckIn, createdAt: $createdAt)';
  }
}

/// @nodoc
abstract mixin class _$AppUserCopyWith<$Res> implements $AppUserCopyWith<$Res> {
  factory _$AppUserCopyWith(_AppUser value, $Res Function(_AppUser) _then) =
      __$AppUserCopyWithImpl;
  @override
  @useResult
  $Res call(
      {String id,
      String email,
      String? displayName,
      String? photoUrl,
      bool isVip,
      DateTime? vipExpiresAt,
      int coins,
      int bonus,
      List<String> favoriteSeriesIds,
      List<String> unlockedEpisodeIds,
      DateTime? lastDailyCheckIn,
      DateTime createdAt});
}

/// @nodoc
class __$AppUserCopyWithImpl<$Res> implements _$AppUserCopyWith<$Res> {
  __$AppUserCopyWithImpl(this._self, this._then);

  final _AppUser _self;
  final $Res Function(_AppUser) _then;

  /// Create a copy of AppUser
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $Res call({
    Object? id = null,
    Object? email = null,
    Object? displayName = freezed,
    Object? photoUrl = freezed,
    Object? isVip = null,
    Object? vipExpiresAt = freezed,
    Object? coins = null,
    Object? bonus = null,
    Object? favoriteSeriesIds = null,
    Object? unlockedEpisodeIds = null,
    Object? lastDailyCheckIn = freezed,
    Object? createdAt = null,
  }) {
    return _then(_AppUser(
      id: null == id
          ? _self.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      email: null == email
          ? _self.email
          : email // ignore: cast_nullable_to_non_nullable
              as String,
      displayName: freezed == displayName
          ? _self.displayName
          : displayName // ignore: cast_nullable_to_non_nullable
              as String?,
      photoUrl: freezed == photoUrl
          ? _self.photoUrl
          : photoUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      isVip: null == isVip
          ? _self.isVip
          : isVip // ignore: cast_nullable_to_non_nullable
              as bool,
      vipExpiresAt: freezed == vipExpiresAt
          ? _self.vipExpiresAt
          : vipExpiresAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      coins: null == coins
          ? _self.coins
          : coins // ignore: cast_nullable_to_non_nullable
              as int,
      bonus: null == bonus
          ? _self.bonus
          : bonus // ignore: cast_nullable_to_non_nullable
              as int,
      favoriteSeriesIds: null == favoriteSeriesIds
          ? _self._favoriteSeriesIds
          : favoriteSeriesIds // ignore: cast_nullable_to_non_nullable
              as List<String>,
      unlockedEpisodeIds: null == unlockedEpisodeIds
          ? _self._unlockedEpisodeIds
          : unlockedEpisodeIds // ignore: cast_nullable_to_non_nullable
              as List<String>,
      lastDailyCheckIn: freezed == lastDailyCheckIn
          ? _self.lastDailyCheckIn
          : lastDailyCheckIn // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      createdAt: null == createdAt
          ? _self.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
    ));
  }
}

// dart format on
