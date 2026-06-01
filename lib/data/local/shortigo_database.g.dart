// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'shortigo_database.dart';

// ignore_for_file: type=lint
class $CachedSeriesTable extends CachedSeries
    with TableInfo<$CachedSeriesTable, CachedSeriesRow> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $CachedSeriesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _payloadMeta =
      const VerificationMeta('payload');
  @override
  late final GeneratedColumn<Uint8List> payload = GeneratedColumn<Uint8List>(
      'payload', aliasedName, false,
      type: DriftSqlType.blob, requiredDuringInsert: true);
  static const VerificationMeta _cachedAtMeta =
      const VerificationMeta('cachedAt');
  @override
  late final GeneratedColumn<DateTime> cachedAt = GeneratedColumn<DateTime>(
      'cached_at', aliasedName, false,
      type: DriftSqlType.dateTime, requiredDuringInsert: true);
  static const VerificationMeta _categoryMeta =
      const VerificationMeta('category');
  @override
  late final GeneratedColumn<String> category = GeneratedColumn<String>(
      'category', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  @override
  List<GeneratedColumn> get $columns => [id, payload, cachedAt, category];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'cached_series';
  @override
  VerificationContext validateIntegrity(Insertable<CachedSeriesRow> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('payload')) {
      context.handle(_payloadMeta,
          payload.isAcceptableOrUnknown(data['payload']!, _payloadMeta));
    } else if (isInserting) {
      context.missing(_payloadMeta);
    }
    if (data.containsKey('cached_at')) {
      context.handle(_cachedAtMeta,
          cachedAt.isAcceptableOrUnknown(data['cached_at']!, _cachedAtMeta));
    } else if (isInserting) {
      context.missing(_cachedAtMeta);
    }
    if (data.containsKey('category')) {
      context.handle(_categoryMeta,
          category.isAcceptableOrUnknown(data['category']!, _categoryMeta));
    } else if (isInserting) {
      context.missing(_categoryMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  CachedSeriesRow map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return CachedSeriesRow(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      payload: attachedDatabase.typeMapping
          .read(DriftSqlType.blob, data['${effectivePrefix}payload'])!,
      cachedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}cached_at'])!,
      category: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}category'])!,
    );
  }

  @override
  $CachedSeriesTable createAlias(String alias) {
    return $CachedSeriesTable(attachedDatabase, alias);
  }
}

class CachedSeriesRow extends DataClass implements Insertable<CachedSeriesRow> {
  final String id;
  final Uint8List payload;
  final DateTime cachedAt;
  final String category;
  const CachedSeriesRow(
      {required this.id,
      required this.payload,
      required this.cachedAt,
      required this.category});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['payload'] = Variable<Uint8List>(payload);
    map['cached_at'] = Variable<DateTime>(cachedAt);
    map['category'] = Variable<String>(category);
    return map;
  }

  CachedSeriesCompanion toCompanion(bool nullToAbsent) {
    return CachedSeriesCompanion(
      id: Value(id),
      payload: Value(payload),
      cachedAt: Value(cachedAt),
      category: Value(category),
    );
  }

  factory CachedSeriesRow.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return CachedSeriesRow(
      id: serializer.fromJson<String>(json['id']),
      payload: serializer.fromJson<Uint8List>(json['payload']),
      cachedAt: serializer.fromJson<DateTime>(json['cachedAt']),
      category: serializer.fromJson<String>(json['category']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'payload': serializer.toJson<Uint8List>(payload),
      'cachedAt': serializer.toJson<DateTime>(cachedAt),
      'category': serializer.toJson<String>(category),
    };
  }

  CachedSeriesRow copyWith(
          {String? id,
          Uint8List? payload,
          DateTime? cachedAt,
          String? category}) =>
      CachedSeriesRow(
        id: id ?? this.id,
        payload: payload ?? this.payload,
        cachedAt: cachedAt ?? this.cachedAt,
        category: category ?? this.category,
      );
  CachedSeriesRow copyWithCompanion(CachedSeriesCompanion data) {
    return CachedSeriesRow(
      id: data.id.present ? data.id.value : this.id,
      payload: data.payload.present ? data.payload.value : this.payload,
      cachedAt: data.cachedAt.present ? data.cachedAt.value : this.cachedAt,
      category: data.category.present ? data.category.value : this.category,
    );
  }

  @override
  String toString() {
    return (StringBuffer('CachedSeriesRow(')
          ..write('id: $id, ')
          ..write('payload: $payload, ')
          ..write('cachedAt: $cachedAt, ')
          ..write('category: $category')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode =>
      Object.hash(id, $driftBlobEquality.hash(payload), cachedAt, category);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is CachedSeriesRow &&
          other.id == this.id &&
          $driftBlobEquality.equals(other.payload, this.payload) &&
          other.cachedAt == this.cachedAt &&
          other.category == this.category);
}

class CachedSeriesCompanion extends UpdateCompanion<CachedSeriesRow> {
  final Value<String> id;
  final Value<Uint8List> payload;
  final Value<DateTime> cachedAt;
  final Value<String> category;
  final Value<int> rowid;
  const CachedSeriesCompanion({
    this.id = const Value.absent(),
    this.payload = const Value.absent(),
    this.cachedAt = const Value.absent(),
    this.category = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  CachedSeriesCompanion.insert({
    required String id,
    required Uint8List payload,
    required DateTime cachedAt,
    required String category,
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        payload = Value(payload),
        cachedAt = Value(cachedAt),
        category = Value(category);
  static Insertable<CachedSeriesRow> custom({
    Expression<String>? id,
    Expression<Uint8List>? payload,
    Expression<DateTime>? cachedAt,
    Expression<String>? category,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (payload != null) 'payload': payload,
      if (cachedAt != null) 'cached_at': cachedAt,
      if (category != null) 'category': category,
      if (rowid != null) 'rowid': rowid,
    });
  }

  CachedSeriesCompanion copyWith(
      {Value<String>? id,
      Value<Uint8List>? payload,
      Value<DateTime>? cachedAt,
      Value<String>? category,
      Value<int>? rowid}) {
    return CachedSeriesCompanion(
      id: id ?? this.id,
      payload: payload ?? this.payload,
      cachedAt: cachedAt ?? this.cachedAt,
      category: category ?? this.category,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (payload.present) {
      map['payload'] = Variable<Uint8List>(payload.value);
    }
    if (cachedAt.present) {
      map['cached_at'] = Variable<DateTime>(cachedAt.value);
    }
    if (category.present) {
      map['category'] = Variable<String>(category.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('CachedSeriesCompanion(')
          ..write('id: $id, ')
          ..write('payload: $payload, ')
          ..write('cachedAt: $cachedAt, ')
          ..write('category: $category, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $CachedEpisodesTable extends CachedEpisodes
    with TableInfo<$CachedEpisodesTable, CachedEpisodeRow> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $CachedEpisodesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _seriesIdMeta =
      const VerificationMeta('seriesId');
  @override
  late final GeneratedColumn<String> seriesId = GeneratedColumn<String>(
      'series_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _orderIdxMeta =
      const VerificationMeta('orderIdx');
  @override
  late final GeneratedColumn<int> orderIdx = GeneratedColumn<int>(
      'order_idx', aliasedName, false,
      type: DriftSqlType.int, requiredDuringInsert: true);
  static const VerificationMeta _payloadMeta =
      const VerificationMeta('payload');
  @override
  late final GeneratedColumn<Uint8List> payload = GeneratedColumn<Uint8List>(
      'payload', aliasedName, false,
      type: DriftSqlType.blob, requiredDuringInsert: true);
  static const VerificationMeta _cachedAtMeta =
      const VerificationMeta('cachedAt');
  @override
  late final GeneratedColumn<DateTime> cachedAt = GeneratedColumn<DateTime>(
      'cached_at', aliasedName, false,
      type: DriftSqlType.dateTime, requiredDuringInsert: true);
  @override
  List<GeneratedColumn> get $columns => [seriesId, orderIdx, payload, cachedAt];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'cached_episodes';
  @override
  VerificationContext validateIntegrity(Insertable<CachedEpisodeRow> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('series_id')) {
      context.handle(_seriesIdMeta,
          seriesId.isAcceptableOrUnknown(data['series_id']!, _seriesIdMeta));
    } else if (isInserting) {
      context.missing(_seriesIdMeta);
    }
    if (data.containsKey('order_idx')) {
      context.handle(_orderIdxMeta,
          orderIdx.isAcceptableOrUnknown(data['order_idx']!, _orderIdxMeta));
    } else if (isInserting) {
      context.missing(_orderIdxMeta);
    }
    if (data.containsKey('payload')) {
      context.handle(_payloadMeta,
          payload.isAcceptableOrUnknown(data['payload']!, _payloadMeta));
    } else if (isInserting) {
      context.missing(_payloadMeta);
    }
    if (data.containsKey('cached_at')) {
      context.handle(_cachedAtMeta,
          cachedAt.isAcceptableOrUnknown(data['cached_at']!, _cachedAtMeta));
    } else if (isInserting) {
      context.missing(_cachedAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {seriesId, orderIdx};
  @override
  CachedEpisodeRow map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return CachedEpisodeRow(
      seriesId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}series_id'])!,
      orderIdx: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}order_idx'])!,
      payload: attachedDatabase.typeMapping
          .read(DriftSqlType.blob, data['${effectivePrefix}payload'])!,
      cachedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}cached_at'])!,
    );
  }

  @override
  $CachedEpisodesTable createAlias(String alias) {
    return $CachedEpisodesTable(attachedDatabase, alias);
  }
}

class CachedEpisodeRow extends DataClass
    implements Insertable<CachedEpisodeRow> {
  final String seriesId;
  final int orderIdx;
  final Uint8List payload;
  final DateTime cachedAt;
  const CachedEpisodeRow(
      {required this.seriesId,
      required this.orderIdx,
      required this.payload,
      required this.cachedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['series_id'] = Variable<String>(seriesId);
    map['order_idx'] = Variable<int>(orderIdx);
    map['payload'] = Variable<Uint8List>(payload);
    map['cached_at'] = Variable<DateTime>(cachedAt);
    return map;
  }

  CachedEpisodesCompanion toCompanion(bool nullToAbsent) {
    return CachedEpisodesCompanion(
      seriesId: Value(seriesId),
      orderIdx: Value(orderIdx),
      payload: Value(payload),
      cachedAt: Value(cachedAt),
    );
  }

  factory CachedEpisodeRow.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return CachedEpisodeRow(
      seriesId: serializer.fromJson<String>(json['seriesId']),
      orderIdx: serializer.fromJson<int>(json['orderIdx']),
      payload: serializer.fromJson<Uint8List>(json['payload']),
      cachedAt: serializer.fromJson<DateTime>(json['cachedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'seriesId': serializer.toJson<String>(seriesId),
      'orderIdx': serializer.toJson<int>(orderIdx),
      'payload': serializer.toJson<Uint8List>(payload),
      'cachedAt': serializer.toJson<DateTime>(cachedAt),
    };
  }

  CachedEpisodeRow copyWith(
          {String? seriesId,
          int? orderIdx,
          Uint8List? payload,
          DateTime? cachedAt}) =>
      CachedEpisodeRow(
        seriesId: seriesId ?? this.seriesId,
        orderIdx: orderIdx ?? this.orderIdx,
        payload: payload ?? this.payload,
        cachedAt: cachedAt ?? this.cachedAt,
      );
  CachedEpisodeRow copyWithCompanion(CachedEpisodesCompanion data) {
    return CachedEpisodeRow(
      seriesId: data.seriesId.present ? data.seriesId.value : this.seriesId,
      orderIdx: data.orderIdx.present ? data.orderIdx.value : this.orderIdx,
      payload: data.payload.present ? data.payload.value : this.payload,
      cachedAt: data.cachedAt.present ? data.cachedAt.value : this.cachedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('CachedEpisodeRow(')
          ..write('seriesId: $seriesId, ')
          ..write('orderIdx: $orderIdx, ')
          ..write('payload: $payload, ')
          ..write('cachedAt: $cachedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
      seriesId, orderIdx, $driftBlobEquality.hash(payload), cachedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is CachedEpisodeRow &&
          other.seriesId == this.seriesId &&
          other.orderIdx == this.orderIdx &&
          $driftBlobEquality.equals(other.payload, this.payload) &&
          other.cachedAt == this.cachedAt);
}

class CachedEpisodesCompanion extends UpdateCompanion<CachedEpisodeRow> {
  final Value<String> seriesId;
  final Value<int> orderIdx;
  final Value<Uint8List> payload;
  final Value<DateTime> cachedAt;
  final Value<int> rowid;
  const CachedEpisodesCompanion({
    this.seriesId = const Value.absent(),
    this.orderIdx = const Value.absent(),
    this.payload = const Value.absent(),
    this.cachedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  CachedEpisodesCompanion.insert({
    required String seriesId,
    required int orderIdx,
    required Uint8List payload,
    required DateTime cachedAt,
    this.rowid = const Value.absent(),
  })  : seriesId = Value(seriesId),
        orderIdx = Value(orderIdx),
        payload = Value(payload),
        cachedAt = Value(cachedAt);
  static Insertable<CachedEpisodeRow> custom({
    Expression<String>? seriesId,
    Expression<int>? orderIdx,
    Expression<Uint8List>? payload,
    Expression<DateTime>? cachedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (seriesId != null) 'series_id': seriesId,
      if (orderIdx != null) 'order_idx': orderIdx,
      if (payload != null) 'payload': payload,
      if (cachedAt != null) 'cached_at': cachedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  CachedEpisodesCompanion copyWith(
      {Value<String>? seriesId,
      Value<int>? orderIdx,
      Value<Uint8List>? payload,
      Value<DateTime>? cachedAt,
      Value<int>? rowid}) {
    return CachedEpisodesCompanion(
      seriesId: seriesId ?? this.seriesId,
      orderIdx: orderIdx ?? this.orderIdx,
      payload: payload ?? this.payload,
      cachedAt: cachedAt ?? this.cachedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (seriesId.present) {
      map['series_id'] = Variable<String>(seriesId.value);
    }
    if (orderIdx.present) {
      map['order_idx'] = Variable<int>(orderIdx.value);
    }
    if (payload.present) {
      map['payload'] = Variable<Uint8List>(payload.value);
    }
    if (cachedAt.present) {
      map['cached_at'] = Variable<DateTime>(cachedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('CachedEpisodesCompanion(')
          ..write('seriesId: $seriesId, ')
          ..write('orderIdx: $orderIdx, ')
          ..write('payload: $payload, ')
          ..write('cachedAt: $cachedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

abstract class _$ShortigoDatabase extends GeneratedDatabase {
  _$ShortigoDatabase(QueryExecutor e) : super(e);
  $ShortigoDatabaseManager get managers => $ShortigoDatabaseManager(this);
  late final $CachedSeriesTable cachedSeries = $CachedSeriesTable(this);
  late final $CachedEpisodesTable cachedEpisodes = $CachedEpisodesTable(this);
  @override
  Iterable<TableInfo<Table, Object?>> get allTables =>
      allSchemaEntities.whereType<TableInfo<Table, Object?>>();
  @override
  List<DatabaseSchemaEntity> get allSchemaEntities =>
      [cachedSeries, cachedEpisodes];
}

typedef $$CachedSeriesTableCreateCompanionBuilder = CachedSeriesCompanion
    Function({
  required String id,
  required Uint8List payload,
  required DateTime cachedAt,
  required String category,
  Value<int> rowid,
});
typedef $$CachedSeriesTableUpdateCompanionBuilder = CachedSeriesCompanion
    Function({
  Value<String> id,
  Value<Uint8List> payload,
  Value<DateTime> cachedAt,
  Value<String> category,
  Value<int> rowid,
});

class $$CachedSeriesTableFilterComposer
    extends Composer<_$ShortigoDatabase, $CachedSeriesTable> {
  $$CachedSeriesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<Uint8List> get payload => $composableBuilder(
      column: $table.payload, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get cachedAt => $composableBuilder(
      column: $table.cachedAt, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get category => $composableBuilder(
      column: $table.category, builder: (column) => ColumnFilters(column));
}

class $$CachedSeriesTableOrderingComposer
    extends Composer<_$ShortigoDatabase, $CachedSeriesTable> {
  $$CachedSeriesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<Uint8List> get payload => $composableBuilder(
      column: $table.payload, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get cachedAt => $composableBuilder(
      column: $table.cachedAt, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get category => $composableBuilder(
      column: $table.category, builder: (column) => ColumnOrderings(column));
}

class $$CachedSeriesTableAnnotationComposer
    extends Composer<_$ShortigoDatabase, $CachedSeriesTable> {
  $$CachedSeriesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<Uint8List> get payload =>
      $composableBuilder(column: $table.payload, builder: (column) => column);

  GeneratedColumn<DateTime> get cachedAt =>
      $composableBuilder(column: $table.cachedAt, builder: (column) => column);

  GeneratedColumn<String> get category =>
      $composableBuilder(column: $table.category, builder: (column) => column);
}

class $$CachedSeriesTableTableManager extends RootTableManager<
    _$ShortigoDatabase,
    $CachedSeriesTable,
    CachedSeriesRow,
    $$CachedSeriesTableFilterComposer,
    $$CachedSeriesTableOrderingComposer,
    $$CachedSeriesTableAnnotationComposer,
    $$CachedSeriesTableCreateCompanionBuilder,
    $$CachedSeriesTableUpdateCompanionBuilder,
    (
      CachedSeriesRow,
      BaseReferences<_$ShortigoDatabase, $CachedSeriesTable, CachedSeriesRow>
    ),
    CachedSeriesRow,
    PrefetchHooks Function()> {
  $$CachedSeriesTableTableManager(
      _$ShortigoDatabase db, $CachedSeriesTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$CachedSeriesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$CachedSeriesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$CachedSeriesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<Uint8List> payload = const Value.absent(),
            Value<DateTime> cachedAt = const Value.absent(),
            Value<String> category = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              CachedSeriesCompanion(
            id: id,
            payload: payload,
            cachedAt: cachedAt,
            category: category,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            required Uint8List payload,
            required DateTime cachedAt,
            required String category,
            Value<int> rowid = const Value.absent(),
          }) =>
              CachedSeriesCompanion.insert(
            id: id,
            payload: payload,
            cachedAt: cachedAt,
            category: category,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$CachedSeriesTableProcessedTableManager = ProcessedTableManager<
    _$ShortigoDatabase,
    $CachedSeriesTable,
    CachedSeriesRow,
    $$CachedSeriesTableFilterComposer,
    $$CachedSeriesTableOrderingComposer,
    $$CachedSeriesTableAnnotationComposer,
    $$CachedSeriesTableCreateCompanionBuilder,
    $$CachedSeriesTableUpdateCompanionBuilder,
    (
      CachedSeriesRow,
      BaseReferences<_$ShortigoDatabase, $CachedSeriesTable, CachedSeriesRow>
    ),
    CachedSeriesRow,
    PrefetchHooks Function()>;
typedef $$CachedEpisodesTableCreateCompanionBuilder = CachedEpisodesCompanion
    Function({
  required String seriesId,
  required int orderIdx,
  required Uint8List payload,
  required DateTime cachedAt,
  Value<int> rowid,
});
typedef $$CachedEpisodesTableUpdateCompanionBuilder = CachedEpisodesCompanion
    Function({
  Value<String> seriesId,
  Value<int> orderIdx,
  Value<Uint8List> payload,
  Value<DateTime> cachedAt,
  Value<int> rowid,
});

class $$CachedEpisodesTableFilterComposer
    extends Composer<_$ShortigoDatabase, $CachedEpisodesTable> {
  $$CachedEpisodesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get seriesId => $composableBuilder(
      column: $table.seriesId, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get orderIdx => $composableBuilder(
      column: $table.orderIdx, builder: (column) => ColumnFilters(column));

  ColumnFilters<Uint8List> get payload => $composableBuilder(
      column: $table.payload, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get cachedAt => $composableBuilder(
      column: $table.cachedAt, builder: (column) => ColumnFilters(column));
}

class $$CachedEpisodesTableOrderingComposer
    extends Composer<_$ShortigoDatabase, $CachedEpisodesTable> {
  $$CachedEpisodesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get seriesId => $composableBuilder(
      column: $table.seriesId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get orderIdx => $composableBuilder(
      column: $table.orderIdx, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<Uint8List> get payload => $composableBuilder(
      column: $table.payload, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get cachedAt => $composableBuilder(
      column: $table.cachedAt, builder: (column) => ColumnOrderings(column));
}

class $$CachedEpisodesTableAnnotationComposer
    extends Composer<_$ShortigoDatabase, $CachedEpisodesTable> {
  $$CachedEpisodesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get seriesId =>
      $composableBuilder(column: $table.seriesId, builder: (column) => column);

  GeneratedColumn<int> get orderIdx =>
      $composableBuilder(column: $table.orderIdx, builder: (column) => column);

  GeneratedColumn<Uint8List> get payload =>
      $composableBuilder(column: $table.payload, builder: (column) => column);

  GeneratedColumn<DateTime> get cachedAt =>
      $composableBuilder(column: $table.cachedAt, builder: (column) => column);
}

class $$CachedEpisodesTableTableManager extends RootTableManager<
    _$ShortigoDatabase,
    $CachedEpisodesTable,
    CachedEpisodeRow,
    $$CachedEpisodesTableFilterComposer,
    $$CachedEpisodesTableOrderingComposer,
    $$CachedEpisodesTableAnnotationComposer,
    $$CachedEpisodesTableCreateCompanionBuilder,
    $$CachedEpisodesTableUpdateCompanionBuilder,
    (
      CachedEpisodeRow,
      BaseReferences<_$ShortigoDatabase, $CachedEpisodesTable, CachedEpisodeRow>
    ),
    CachedEpisodeRow,
    PrefetchHooks Function()> {
  $$CachedEpisodesTableTableManager(
      _$ShortigoDatabase db, $CachedEpisodesTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$CachedEpisodesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$CachedEpisodesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$CachedEpisodesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> seriesId = const Value.absent(),
            Value<int> orderIdx = const Value.absent(),
            Value<Uint8List> payload = const Value.absent(),
            Value<DateTime> cachedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              CachedEpisodesCompanion(
            seriesId: seriesId,
            orderIdx: orderIdx,
            payload: payload,
            cachedAt: cachedAt,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String seriesId,
            required int orderIdx,
            required Uint8List payload,
            required DateTime cachedAt,
            Value<int> rowid = const Value.absent(),
          }) =>
              CachedEpisodesCompanion.insert(
            seriesId: seriesId,
            orderIdx: orderIdx,
            payload: payload,
            cachedAt: cachedAt,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$CachedEpisodesTableProcessedTableManager = ProcessedTableManager<
    _$ShortigoDatabase,
    $CachedEpisodesTable,
    CachedEpisodeRow,
    $$CachedEpisodesTableFilterComposer,
    $$CachedEpisodesTableOrderingComposer,
    $$CachedEpisodesTableAnnotationComposer,
    $$CachedEpisodesTableCreateCompanionBuilder,
    $$CachedEpisodesTableUpdateCompanionBuilder,
    (
      CachedEpisodeRow,
      BaseReferences<_$ShortigoDatabase, $CachedEpisodesTable, CachedEpisodeRow>
    ),
    CachedEpisodeRow,
    PrefetchHooks Function()>;

class $ShortigoDatabaseManager {
  final _$ShortigoDatabase _db;
  $ShortigoDatabaseManager(this._db);
  $$CachedSeriesTableTableManager get cachedSeries =>
      $$CachedSeriesTableTableManager(_db, _db.cachedSeries);
  $$CachedEpisodesTableTableManager get cachedEpisodes =>
      $$CachedEpisodesTableTableManager(_db, _db.cachedEpisodes);
}
