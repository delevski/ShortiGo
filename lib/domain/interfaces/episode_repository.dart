import '../../domain/entities/episode.dart';

abstract class EpisodeRepository {
  Future<List<Episode>> bySeriesId(String seriesId);
  Future<Episode> byId(String id);
}
