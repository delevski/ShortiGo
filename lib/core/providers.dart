import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart' as fb;
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/ads/admob_ad_gateway.dart';
import '../data/firestore/episode_repository.dart';
import '../data/firestore/series_repository.dart';
import '../data/firestore/transaction_repository.dart';
import '../data/firestore/user_repository.dart';
import '../data/iap/revenuecat_iap_gateway.dart';
import '../data/local/shortigo_database.dart';
import '../data/storage/firebase_video_source.dart';
import '../domain/entities/user.dart';
import '../domain/interfaces/ad_gateway.dart';
import '../domain/interfaces/episode_repository.dart';
import '../domain/interfaces/iap_gateway.dart';
import '../domain/interfaces/series_repository.dart';
import '../domain/interfaces/transaction_repository.dart';
import '../domain/interfaces/user_repository.dart';
import '../domain/interfaces/video_source.dart';

// === Foundational providers (always available) ===

final firestoreProvider =
    Provider<FirebaseFirestore>((_) => FirebaseFirestore.instance);

final firebaseStorageProvider =
    Provider<FirebaseStorage>((_) => FirebaseStorage.instance);

final firebaseAuthProvider = Provider<fb.FirebaseAuth>((_) {
  return fb.FirebaseAuth.instance;
});

final currentAuthUserProvider = StreamProvider<fb.User?>((ref) {
  return ref.watch(firebaseAuthProvider).authStateChanges();
});

final currentAppUserDocProvider = StreamProvider<AppUser?>((ref) {
  final auth = ref.watch(currentAuthUserProvider).value;
  if (auth == null) {
    return Stream.value(null);
  }
  return ref.watch(userRepositoryProvider).watch(auth.uid);
});

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

final transactionRepositoryProvider = Provider<TransactionRepository>((ref) {
  return FirestoreTransactionRepository(ref.watch(firestoreProvider));
});

final userRepositoryProvider = Provider<UserRepository>((ref) {
  return FirestoreUserRepository(ref.watch(firestoreProvider));
});

final videoSourceProvider = Provider<VideoSource>((ref) {
  return FirebaseStorageVideoSource(ref.watch(firebaseStorageProvider));
});

final adGatewayProvider = Provider<AdGateway>((_) {
  return AdmobAdGateway();
});

final iapGatewayProvider = Provider<IapGateway>((_) {
  return RevenueCatIapGateway();
});

// === Future providers (added in their respective milestones) ===
// M6: adminConfigGatewayProvider
