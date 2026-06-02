import 'package:flutter_test/flutter_test.dart';
import 'package:shortigo/data/storage/firebase_video_source.dart';

void main() {
  group('FirebaseStorageVideoSource', () {
    test('treats HTTP(S) episode video URLs as direct playable URLs', () {
      expect(isDirectVideoUrl('https://example.com/video.mp4'), isTrue);
      expect(isDirectVideoUrl('http://example.com/video.mp4'), isTrue);
      expect(isDirectVideoUrl('series/s1/episodes/e1.mp4'), isFalse);
    });
  });
}
