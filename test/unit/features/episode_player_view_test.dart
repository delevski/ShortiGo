import 'package:flutter_test/flutter_test.dart';
import 'package:shortigo/features/episode_player/presentation/episode_player_view.dart';

void main() {
  group('episode player viewport aspect ratio', () {
    test('uses the actual viewport ratio instead of a fixed 9:16 ratio', () {
      final aspectRatio = episodePlayerViewportAspectRatio(
        width: 393,
        height: 873,
      );

      expect(aspectRatio, closeTo(393 / 873, 0.0001));
      expect(aspectRatio, isNot(closeTo(9 / 16, 0.0001)));
    });

    test('keeps the current ratio when layout has no usable height', () {
      expect(
        episodePlayerViewportAspectRatio(width: 393, height: 0),
        isNull,
      );
    });
  });
}
