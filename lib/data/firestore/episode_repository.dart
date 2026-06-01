import 'package:cloud_firestore/cloud_firestore.dart';
import '../../domain/entities/episode.dart';
import '../../domain/interfaces/episode_repository.dart';

class FirestoreEpisodeRepository implements EpisodeRepository {
  FirestoreEpisodeRepository(this._db);
  final FirebaseFirestore _db;

  @override
  Future<List<Episode>> bySeriesId(String seriesId) async {
    final snap = await _db
        .collection('episodes')
        .where('seriesId', isEqualTo: seriesId)
        .orderBy('order')
        .get();
    return snap.docs.map((d) => Episode.fromJson({...d.data(), 'id': d.id})).toList();
  }

  @override
  Future<Episode> byId(String id) async {
    final d = await _db.collection('episodes').doc(id).get();
    return Episode.fromJson({...d.data()!, 'id': d.id});
  }
}
