import 'package:freezed_annotation/freezed_annotation.dart';
import '../../../domain/entities/category.dart';
import '../../../domain/entities/series.dart';

part 'discover_state.freezed.dart';

@freezed
abstract class DiscoverState with _$DiscoverState {
  const factory DiscoverState({
    @Default(Category.forYou) Category currentCategory,
    @Default(<Series>[]) List<Series> series,
    @Default(false) bool isLoading,
    String? error,
  }) = _DiscoverState;
}
