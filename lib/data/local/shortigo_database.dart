import 'dart:io';
import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

part 'shortigo_database.g.dart';

@DataClassName('CachedSeriesRow')
class CachedSeries extends Table {
  TextColumn get id => text()();
  BlobColumn get payload => blob()();
  DateTimeColumn get cachedAt => dateTime()();
  TextColumn get category => text()();

  @override
  Set<Column> get primaryKey => {id};
}

@DataClassName('CachedEpisodeRow')
class CachedEpisodes extends Table {
  TextColumn get seriesId => text()();
  IntColumn get orderIdx => integer()();
  BlobColumn get payload => blob()();
  DateTimeColumn get cachedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {seriesId, orderIdx};
}

@DriftDatabase(tables: [CachedSeries, CachedEpisodes])
class ShortigoDatabase extends _$ShortigoDatabase {
  ShortigoDatabase() : super(_openConnection());
  ShortigoDatabase.forTesting(super.e);

  @override
  int get schemaVersion => 1;

  static LazyDatabase _openConnection() {
    return LazyDatabase(() async {
      final dir = await getApplicationDocumentsDirectory();
      final file = File(p.join(dir.path, 'shortigo_cache.sqlite'));
      return NativeDatabase.createInBackground(file);
    });
  }
}
