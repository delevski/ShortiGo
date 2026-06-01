import 'package:better_player_plus/better_player_plus.dart';
import 'package:flutter/material.dart';

import '../../../domain/entities/episode.dart';

class VideoPreCacheManager {
  VideoPreCacheManager({this.windowSize = 3});

  int windowSize;

  final Map<String, BetterPlayerController> _controllers = {};

  Future<void> setupAt({
    required int currentIndex,
    required List<Episode> episodes,
    required Future<String> Function(Episode) urlFor,
  }) async {
    if (episodes.isEmpty || currentIndex < 0 || currentIndex >= episodes.length) {
      await disposeAll();
      return;
    }

    final keepIds = <String>{episodes[currentIndex].id};
    var remaining = windowSize - keepIds.length;
    for (var offset = 1; remaining > 0; offset++) {
      final next = currentIndex + offset;
      if (next < episodes.length) {
        keepIds.add(episodes[next].id);
        remaining--;
      }

      final previous = currentIndex - offset;
      if (remaining > 0 && previous >= 0) {
        keepIds.add(episodes[previous].id);
        remaining--;
      }

      if (next >= episodes.length && previous < 0) {
        break;
      }
    }

    final toRemove = _controllers.keys
        .where((id) => !keepIds.contains(id))
        .toList(growable: false);
    for (final id in toRemove) {
      _controllers[id]?.dispose();
      _controllers.remove(id);
    }

    for (final id in keepIds) {
      if (_controllers.containsKey(id)) {
        continue;
      }

      final episode = episodes.firstWhere((item) => item.id == id);
      try {
        final url = await urlFor(episode);
        final controller = BetterPlayerController(
          const BetterPlayerConfiguration(
            autoPlay: false,
            aspectRatio: 9 / 16,
            fit: BoxFit.cover,
            controlsConfiguration: BetterPlayerControlsConfiguration(
              showControls: false,
            ),
          ),
        );
        await controller.setupDataSource(
          BetterPlayerDataSource.network(
            url,
            cacheConfiguration: const BetterPlayerCacheConfiguration(
              useCache: true,
            ),
          ),
        );
        _controllers[id] = controller;
      } catch (_) {
        // Pre-cache is opportunistic; feed rendering should not depend on it.
      }
    }
  }

  BetterPlayerController? controllerFor(String id) => _controllers[id];

  Future<void> play(String id) async {
    for (final controller in _controllers.values) {
      await controller.pause();
    }
    await _controllers[id]?.play();
  }

  Future<void> pauseAll() async {
    for (final controller in _controllers.values) {
      await controller.pause();
    }
  }

  Future<void> disposeAll() async {
    for (final controller in _controllers.values) {
      controller.dispose();
    }
    _controllers.clear();
  }
}
