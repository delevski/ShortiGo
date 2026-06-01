import 'package:cloud_firestore/cloud_firestore.dart';

import '../../domain/entities/category.dart';
import '../../domain/entities/series.dart';
import '../../domain/interfaces/series_repository.dart';

class FirestoreSeriesRepository implements SeriesRepository {
  FirestoreSeriesRepository(this._db, {required this.featuredDocId});

  final FirebaseFirestore _db;
  final String featuredDocId;

  CollectionReference<Map<String, dynamic>> get _col =>
      _db.collection('series');

  @override
  Future<List<Series>> forYou({int limit = 20}) async {
    final snap = await _db.collection('admin').doc(featuredDocId).get();
    final data = snap.data();
    if (data == null) return [];
    final ids = List<String>.from((data['seriesIds'] ?? const <String>[]) as Iterable);
    if (ids.isEmpty) return [];
    final docs = await _db.collection('series').where(FieldPath.documentId, whereIn: ids).get();
    final byId = {for (final d in docs.docs) d.id: d};
    final ordered = [for (final id in ids) if (byId[id] != null) byId[id]!];
    return ordered
        .take(limit)
        .map((d) => _toSeries(d))
        .where((s) => s.isPublished)
        .toList();
  }

  @override
  Future<List<Series>> byCategory(Category category, {int limit = 20}) async {
    if (category == Category.forYou) return forYou(limit: limit);
    Query<Map<String, dynamic>> q = _col.where('isPublished', isEqualTo: true);
    if (category == Category.vip) {
      q = q.where('isVip', isEqualTo: true);
    } else {
      q = q.where('category', isEqualTo: category.id);
    }
    if (category == Category.hot) {
      q = q.orderBy('popularity', descending: true);
    } else {
      q = q.orderBy('createdAt', descending: true);
    }
    final snap = await q.limit(limit).get();
    return snap.docs.map(_toSeries).toList();
  }

  @override
  Future<Series> byId(String id) async {
    final d = await _col.doc(id).get();
    return _toSeries(d);
  }

  Series _toSeries(DocumentSnapshot<Map<String, dynamic>> d) {
    return Series.fromJson({...d.data()!, 'id': d.id});
  }
}
