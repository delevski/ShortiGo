import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shortigo/features/episode_player/presentation/episode_player_view.dart';

void main() {
  group('video app lifecycle', () {
    test('pauses playback when the app is no longer foregrounded', () {
      expect(shouldPauseVideoForLifecycle(AppLifecycleState.inactive), isTrue);
      expect(shouldPauseVideoForLifecycle(AppLifecycleState.hidden), isTrue);
      expect(shouldPauseVideoForLifecycle(AppLifecycleState.paused), isTrue);
      expect(shouldPauseVideoForLifecycle(AppLifecycleState.detached), isTrue);
    });

    test('does not pause again for foreground resume', () {
      expect(shouldPauseVideoForLifecycle(AppLifecycleState.resumed), isFalse);
    });
  });
}
