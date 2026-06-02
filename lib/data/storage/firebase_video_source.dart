import 'package:firebase_storage/firebase_storage.dart';

import '../../domain/interfaces/video_source.dart';

class FirebaseStorageVideoSource implements VideoSource {
  FirebaseStorageVideoSource(this._storage);

  final FirebaseStorage _storage;

  @override
  Future<String> playableUrl({
    required String seriesId,
    required String episodeId,
    required String storagePath,
  }) async {
    if (isDirectVideoUrl(storagePath)) {
      return storagePath;
    }
    final ref = _storage.ref(storagePath);
    return ref.getDownloadURL();
  }
}

bool isDirectVideoUrl(String value) {
  return value.startsWith('http://') || value.startsWith('https://');
}
