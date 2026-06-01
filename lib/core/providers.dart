import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/firestore/episode_repository.dart';
import '../data/firestore/series_repository.dart';
import '../data/local/shortigo_database.dart';
import '../data/storage/firebase_video_source.dart';
import '../domain/interfaces/episode_repository.dart';
import '../domain/interfaces/series_repository.dart';
import '../domain/interfaces/video_source.dart';

// === Foundational providers (always available) ===

final firestoreProvider =
    Provider<FirebaseFirestore>((_) => FirebaseFirestore.instance);

final firebaseStorageProvider =
    Provider<FirebaseStorage>((_) => FirebaseStorage.instance);

final shortigoDatabaseProvider = Provider<ShortigoDatabase>((_) {
  return ShortigoDatabase();
});

final seriesRepositoryProvider = Provider<SeriesRepository>((ref) {
  return FirestoreSeriesRepository(
    ref.watch(firestoreProvider),
    featuredDocId: 'featured',
  );
});

final episodeRepositoryProvider = Provider<EpisodeRepository>((ref) {
  return FirestoreEpisodeRepository(ref.watch(firestoreProvider));
});

final videoSourceProvider = Provider<VideoSource>((ref) {
  return FirebaseStorageVideoSource(ref.watch(firebaseStorageProvider));
});

// === Future providers (added in their respective milestones) ===
// M4: userRepositoryProvider, transactionRepositoryProvider, adGatewayProvider
// M5: iapGatewayProvider
// M6: adminConfigGatewayProvider, currentAuthUserProvider
