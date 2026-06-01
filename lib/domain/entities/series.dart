import 'package:freezed_annotation/freezed_annotation.dart';

import 'category.dart';

part 'series.freezed.dart';
part 'series.g.dart';

@freezed
abstract class Series with _$Series {
  const factory Series({
    required String id,
    required String title,
    @Default('') String description,
    required String coverUrl,
    required Category category,
    @Default(false) bool isVip,
    @Default(0) int episodeCount,
    @Default(0) int totalDurationSec,
    required DateTime createdAt,
    @Default(0) int popularity,
    @Default(true) bool isPublished,
  }) = _Series;

  factory Series.fromJson(Map<String, dynamic> json) => _$SeriesFromJson(json);
}
