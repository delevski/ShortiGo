// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'discover_state.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$DiscoverState {
  Category get currentCategory;
  List<Series> get series;
  bool get isLoading;
  String? get error;

  /// Create a copy of DiscoverState
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  $DiscoverStateCopyWith<DiscoverState> get copyWith =>
      _$DiscoverStateCopyWithImpl<DiscoverState>(
          this as DiscoverState, _$identity);

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is DiscoverState &&
            (identical(other.currentCategory, currentCategory) ||
                other.currentCategory == currentCategory) &&
            const DeepCollectionEquality().equals(other.series, series) &&
            (identical(other.isLoading, isLoading) ||
                other.isLoading == isLoading) &&
            (identical(other.error, error) || other.error == error));
  }

  @override
  int get hashCode => Object.hash(runtimeType, currentCategory,
      const DeepCollectionEquality().hash(series), isLoading, error);

  @override
  String toString() {
    return 'DiscoverState(currentCategory: $currentCategory, series: $series, isLoading: $isLoading, error: $error)';
  }
}

/// @nodoc
abstract mixin class $DiscoverStateCopyWith<$Res> {
  factory $DiscoverStateCopyWith(
          DiscoverState value, $Res Function(DiscoverState) _then) =
      _$DiscoverStateCopyWithImpl;
  @useResult
  $Res call(
      {Category currentCategory,
      List<Series> series,
      bool isLoading,
      String? error});
}

/// @nodoc
class _$DiscoverStateCopyWithImpl<$Res>
    implements $DiscoverStateCopyWith<$Res> {
  _$DiscoverStateCopyWithImpl(this._self, this._then);

  final DiscoverState _self;
  final $Res Function(DiscoverState) _then;

  /// Create a copy of DiscoverState
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? currentCategory = null,
    Object? series = null,
    Object? isLoading = null,
    Object? error = freezed,
  }) {
    return _then(_self.copyWith(
      currentCategory: null == currentCategory
          ? _self.currentCategory
          : currentCategory // ignore: cast_nullable_to_non_nullable
              as Category,
      series: null == series
          ? _self.series
          : series // ignore: cast_nullable_to_non_nullable
              as List<Series>,
      isLoading: null == isLoading
          ? _self.isLoading
          : isLoading // ignore: cast_nullable_to_non_nullable
              as bool,
      error: freezed == error
          ? _self.error
          : error // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// Adds pattern-matching-related methods to [DiscoverState].
extension DiscoverStatePatterns on DiscoverState {
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
    TResult Function(_DiscoverState value)? $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _DiscoverState() when $default != null:
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
    TResult Function(_DiscoverState value) $default,
  ) {
    final _that = this;
    switch (_that) {
      case _DiscoverState():
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
    TResult? Function(_DiscoverState value)? $default,
  ) {
    final _that = this;
    switch (_that) {
      case _DiscoverState() when $default != null:
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
    TResult Function(Category currentCategory, List<Series> series,
            bool isLoading, String? error)?
        $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _DiscoverState() when $default != null:
        return $default(
            _that.currentCategory, _that.series, _that.isLoading, _that.error);
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
    TResult Function(Category currentCategory, List<Series> series,
            bool isLoading, String? error)
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _DiscoverState():
        return $default(
            _that.currentCategory, _that.series, _that.isLoading, _that.error);
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
    TResult? Function(Category currentCategory, List<Series> series,
            bool isLoading, String? error)?
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _DiscoverState() when $default != null:
        return $default(
            _that.currentCategory, _that.series, _that.isLoading, _that.error);
      case _:
        return null;
    }
  }
}

/// @nodoc

class _DiscoverState implements DiscoverState {
  const _DiscoverState(
      {this.currentCategory = Category.forYou,
      final List<Series> series = const <Series>[],
      this.isLoading = false,
      this.error})
      : _series = series;

  @override
  @JsonKey()
  final Category currentCategory;
  final List<Series> _series;
  @override
  @JsonKey()
  List<Series> get series {
    if (_series is EqualUnmodifiableListView) return _series;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_series);
  }

  @override
  @JsonKey()
  final bool isLoading;
  @override
  final String? error;

  /// Create a copy of DiscoverState
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  _$DiscoverStateCopyWith<_DiscoverState> get copyWith =>
      __$DiscoverStateCopyWithImpl<_DiscoverState>(this, _$identity);

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _DiscoverState &&
            (identical(other.currentCategory, currentCategory) ||
                other.currentCategory == currentCategory) &&
            const DeepCollectionEquality().equals(other._series, _series) &&
            (identical(other.isLoading, isLoading) ||
                other.isLoading == isLoading) &&
            (identical(other.error, error) || other.error == error));
  }

  @override
  int get hashCode => Object.hash(runtimeType, currentCategory,
      const DeepCollectionEquality().hash(_series), isLoading, error);

  @override
  String toString() {
    return 'DiscoverState(currentCategory: $currentCategory, series: $series, isLoading: $isLoading, error: $error)';
  }
}

/// @nodoc
abstract mixin class _$DiscoverStateCopyWith<$Res>
    implements $DiscoverStateCopyWith<$Res> {
  factory _$DiscoverStateCopyWith(
          _DiscoverState value, $Res Function(_DiscoverState) _then) =
      __$DiscoverStateCopyWithImpl;
  @override
  @useResult
  $Res call(
      {Category currentCategory,
      List<Series> series,
      bool isLoading,
      String? error});
}

/// @nodoc
class __$DiscoverStateCopyWithImpl<$Res>
    implements _$DiscoverStateCopyWith<$Res> {
  __$DiscoverStateCopyWithImpl(this._self, this._then);

  final _DiscoverState _self;
  final $Res Function(_DiscoverState) _then;

  /// Create a copy of DiscoverState
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $Res call({
    Object? currentCategory = null,
    Object? series = null,
    Object? isLoading = null,
    Object? error = freezed,
  }) {
    return _then(_DiscoverState(
      currentCategory: null == currentCategory
          ? _self.currentCategory
          : currentCategory // ignore: cast_nullable_to_non_nullable
              as Category,
      series: null == series
          ? _self._series
          : series // ignore: cast_nullable_to_non_nullable
              as List<Series>,
      isLoading: null == isLoading
          ? _self.isLoading
          : isLoading // ignore: cast_nullable_to_non_nullable
              as bool,
      error: freezed == error
          ? _self.error
          : error // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

// dart format on
