import 'package:flutter_test/flutter_test.dart';
import 'package:shortigo/domain/entities/episode.dart';

void main() {
  test('Episode round-trips through JSON', () {
    const episode = Episode(
      id: 'e1',
      seriesId: 's1',
      order: 1,
      videoUrl: 'https://x/v.mp4',
      thumbnailUrl: 'https://x/t.jpg',
      durationSec: 60,
      isVipLocked: false,
    );

    expect(Episode.fromJson(episode.toJson()), equals(episode));
  });
}
