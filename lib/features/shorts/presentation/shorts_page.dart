import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/error/friendly_error.dart';
import '../../../core/providers.dart';
import '../../../domain/entities/episode.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../application/shorts_feed_notifier.dart';
import '../application/video_pre_cache_manager.dart';
import 'video_card.dart';

class ShortsPage extends ConsumerStatefulWidget {
  const ShortsPage({super.key});

  @override
  ConsumerState<ShortsPage> createState() => _ShortsPageState();
}

class _ShortsPageState extends ConsumerState<ShortsPage> {
  final _pageController = PageController();
  final _preCache = VideoPreCacheManager();

  int _current = 0;
  int _swipeNetworkCalls = 0;
  bool _isPriming = false;

  @override
  void dispose() {
    unawaited(_preCache.disposeAll());
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(shortsFeedNotifierProvider);

    return Scaffold(
      backgroundColor: Colors.black,
      body: async.when(
        loading: () => const LoadingView(),
        error: (error, _) => ErrorView(
          error: friendlyErrorFor(error),
          onRetry: () => ref.invalidate(shortsFeedNotifierProvider),
        ),
        data: (state) {
          if (state.episodes.isEmpty) {
            return const Center(
              child: Text(
                'No shorts yet',
                style: TextStyle(color: Colors.white),
              ),
            );
          }

          final currentEpisode = state.episodes[_current];
          if (_preCache.controllerFor(currentEpisode.id) == null &&
              !_isPriming) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              unawaited(_doPageChange(_current, state.episodes));
            });
          }

          return PageView.builder(
            controller: _pageController,
            scrollDirection: Axis.vertical,
            itemCount: state.episodes.length,
            onPageChanged: (index) => _onPageChanged(index, state.episodes),
            itemBuilder: (_, index) {
              final episode = state.episodes[index];

              return VideoCard(
                episode: episode,
                controller: _preCache.controllerFor(episode.id),
                isActive: index == _current,
                onTapSeries: () => context.push('/series/${episode.seriesId}'),
              );
            },
          );
        },
      ),
    );
  }

  void _onPageChanged(int index, List<Episode> episodes) {
    if (kDebugMode) {
      _swipeNetworkCalls = 0;
    }
    setState(() => _current = index);
    unawaited(_doPageChange(index, episodes));
  }

  Future<void> _doPageChange(int index, List<Episode> episodes) async {
    if (_isPriming || !mounted) {
      return;
    }

    setState(() => _isPriming = true);
    try {
      await _preCache.setupAt(
        currentIndex: index,
        episodes: episodes,
        urlFor: (episode) async {
          if (kDebugMode) {
            _swipeNetworkCalls++;
          }
          return ref.read(videoSourceProvider).playableUrl(
                seriesId: episode.seriesId,
                episodeId: episode.id,
                storagePath:
                    'series/${episode.seriesId}/episodes/${episode.id}.mp4',
              );
        },
      );
      await _preCache.play(episodes[index].id);
      if (kDebugMode && _swipeNetworkCalls > 0) {
        debugPrint(
          'Pre-cache fired $_swipeNetworkCalls network calls for setupAt.',
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isPriming = false);
      }
    }
  }
}
