import '../../domain/entities/category.dart';
import '../../domain/entities/series.dart';

abstract class SeriesRepository {
  Future<List<Series>> forYou({int limit = 20});
  Future<List<Series>> byCategory(Category category, {int limit = 20});
  Future<Series> byId(String id);
}
