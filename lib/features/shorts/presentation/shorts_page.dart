import 'dart:async';
import 'dart:io';

import 'package:better_player_plus/better_player_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/error/friendly_error.dart';
import '../../../core/providers.dart';
import '../../../domain/entities/episode.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../episode_player/presentation/episode_player_view.dart';
import '../application/shorts_feed_notifier.dart';
import '../application/video_pre_cache_manager.dart';
import 'shorts_info_panel.dart';
import 'shorts_video_progress_bar.dart';
import 'video_card.dart';

class ShortsPage extends ConsumerStatefulWidget {
  const ShortsPage({super.key});

  @override
  ConsumerState<ShortsPage> createState() => _ShortsPageState();
}

class _ShortsPageState extends ConsumerState<ShortsPage>
    with WidgetsBindingObserver {
  final _pageController = PageController();
  final _preCache = VideoPreCacheManager();
  final _urlCache = <String, Future<String>>{};

  late final BetterPlayerController _playerController;

  int _current = 0;
  Set<String> _keepIds = const {};
  int _playGeneration = 0;
  bool _isLoading = true;
  bool _hasError = false;
  bool _playerMounted = false;
  String? _attachedEpisodeId;
  double _playbackProgress = 0;
  bool _panelCollapsed = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _playerController = BetterPlayerController(
      const BetterPlayerConfiguration(
        autoPlay: false,
        autoDispose: false,
        handleLifecycle: false,
        aspectRatio: 9 / 16,
        fit: BoxFit.cover,
        controlsConfiguration: BetterPlayerControlsConfiguration(
          showControls: false,
        ),
      ),
    );
    _playerController.addEventsListener(_onPlayerEvent);
    _maybeShrinkWindow();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _playerMounted = false;
    _playerController.dispose(forceDispose: true);
    _pageController.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (shouldPauseVideoForLifecycle(state)) {
      unawaited(_safePause());
    }
  }

  void _onPlayerEvent(BetterPlayerEvent event) {
    if (!mounted) {
      return;
    }

    switch (event.betterPlayerEventType) {
      case BetterPlayerEventType.exception:
        setState(() => _hasError = true);
      case BetterPlayerEventType.progress:
      case BetterPlayerEventType.finished:
        final next = _progressFromEvent(event);
        if (next != null && (next - _playbackProgress).abs() > 0.001) {
          setState(() => _playbackProgress = next);
        }
      default:
        break;
    }
  }

  double? _progressFromEvent(BetterPlayerEvent event) {
    if (event.betterPlayerEventType == BetterPlayerEventType.finished) {
      return 1;
    }

    final position = event.parameters?['progress'] as Duration?;
    final duration = event.parameters?['duration'] as Duration?;
    if (position == null ||
        duration == null ||
        duration.inMilliseconds <= 0) {
      return null;
    }

    return position.inMilliseconds / duration.inMilliseconds;
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

          if (_keepIds.isEmpty) {
            _keepIds = _preCache.keepIdsFor(
              currentIndex: _current,
              episodes: state.episodes,
            );
            _prefetchUrls(state.episodes);
            WidgetsBinding.instance.addPostFrameCallback((_) {
              unawaited(_playEpisodeAt(_current, state.episodes));
            });
          }

          final activeEpisode = state.episodes[_current];
          final series = state.seriesById[activeEpisode.seriesId];

          return Stack(
            children: [
              PageView.builder(
                controller: _pageController,
                scrollDirection: Axis.vertical,
                itemCount: state.episodes.length,
                onPageChanged: (index) =>
                    _onPageChanged(index, state.episodes),
                itemBuilder: (_, index) {
                  final episode = state.episodes[index];
                  final isActive = index == _current;
                  final showPlayer = isActive && _playerMounted;

                  return Stack(
                    fit: StackFit.expand,
                    children: [
                      if (showPlayer)
                        Positioned.fill(
                          child: IgnorePointer(
                            child: LayoutBuilder(
                              builder: (context, constraints) {
                                // Force the video surface to match the full
                                // viewport so it fills edge-to-edge instead of
                                // letterboxing to a fixed 9:16 box.
                                if (constraints.maxHeight > 0) {
                                  _playerController.setOverriddenAspectRatio(
                                    constraints.maxWidth /
                                        constraints.maxHeight,
                                  );
                                }
                                return BetterPlayer(
                                  key: ValueKey(
                                    _attachedEpisodeId ?? 'shorts_player',
                                  ),
                                  controller: _playerController,
                                );
                              },
                            ),
                          ),
                        ),
                      VideoCard(
                        key: ValueKey('chrome_${episode.id}'),
                        episode: episode,
                        isActive: isActive,
                        isLoading: isActive && _isLoading,
                        hasError: isActive && _hasError,
                        onRetry: () => unawaited(
                          _playEpisodeAt(_current, state.episodes),
                        ),
                      ),
                    ],
                  );
                },
              ),
              Positioned(
                top: 0,
                left: 0,
                right: 0,
                child: ShortsVideoProgressBar(
                  progress: _playbackProgress,
                  visible: _playerMounted && !_isLoading && !_hasError,
                ),
              ),
              if (series != null)
                Positioned(
                  left: 0,
                  right: 0,
                  bottom: 0,
                  child: AnimatedSwitcher(
                    duration: const Duration(milliseconds: 420),
                    reverseDuration: const Duration(milliseconds: 360),
                    transitionBuilder: (child, animation) {
                      return ShortsPanelReveal(
                        animation: animation,
                        child: child,
                      );
                    },
                    layoutBuilder: (currentChild, previousChildren) {
                      return Stack(
                        alignment: Alignment.bottomRight,
                        children: [
                          ...previousChildren,
                          if (currentChild != null) currentChild,
                        ],
                      );
                    },
                    child: _panelCollapsed
                        ? Align(
                            key: const ValueKey('shorts_info_fab'),
                            alignment: Alignment.bottomRight,
                            child: Padding(
                              padding: const EdgeInsets.fromLTRB(0, 0, 16, 12),
                              child: SeriesInfoFab(
                                onExpand: () =>
                                    setState(() => _panelCollapsed = false),
                              ),
                            ),
                          )
                        : ShortsInfoPanel(
                            key: ValueKey('shorts_info_${series.id}'),
                            series: series,
                            episode: activeEpisode,
                            onCollapse: () =>
                                setState(() => _panelCollapsed = true),
                          ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }

  void _onPageChanged(int index, List<Episode> episodes) {
    setState(() {
      _current = index;
      _keepIds = _preCache.keepIdsFor(currentIndex: index, episodes: episodes);
      _isLoading = true;
      _hasError = false;
      _playbackProgress = 0;
    });
    _prefetchUrls(episodes);
    unawaited(_playEpisodeAt(index, episodes));
  }

  Future<void> _playEpisodeAt(int index, List<Episode> episodes) async {
    if (index < 0 || index >= episodes.length) {
      return;
    }

    final episode = episodes[index];
    final generation = ++_playGeneration;

    if (!_playerMounted) {
      setState(() {
        _isLoading = true;
        _hasError = false;
        _playerMounted = true;
        _playbackProgress = 0;
      });
      await _waitEndOfFrame();
      if (!mounted || generation != _playGeneration) {
        return;
      }
    } else {
      setState(() {
        _isLoading = true;
        _hasError = false;
        _playbackProgress = 0;
      });
    }

    try {
      await _safePause();
      if (!mounted || generation != _playGeneration) {
        return;
      }

      final url = await _urlFor(episode);
      if (!mounted || generation != _playGeneration) {
        return;
      }

      await _playerController.setupDataSource(
        BetterPlayerDataSource.network(
          url,
          cacheConfiguration: const BetterPlayerCacheConfiguration(
            useCache: true,
          ),
        ),
      );
      if (!mounted || generation != _playGeneration) {
        return;
      }

      setState(() {
        _attachedEpisodeId = episode.id;
        _isLoading = false;
      });

      await _waitEndOfFrame();
      if (!mounted || generation != _playGeneration) {
        return;
      }

      await _safePlay();
    } catch (_) {
      if (mounted && generation == _playGeneration) {
        setState(() {
          _hasError = true;
          _isLoading = false;
        });
      }
    }
  }

  Future<String> _urlFor(Episode episode) {
    return _urlCache.putIfAbsent(
      episode.id,
      () => ref.read(videoSourceProvider).playableUrl(
            seriesId: episode.seriesId,
            episodeId: episode.id,
            storagePath: episode.videoUrl,
          ),
    );
  }

  void _prefetchUrls(List<Episode> episodes) {
    for (final episode in episodes) {
      if (_keepIds.contains(episode.id)) {
        unawaited(_urlFor(episode));
      }
    }
  }

  Future<void> _waitEndOfFrame() async {
    await SchedulerBinding.instance.endOfFrame;
  }

  Future<void> _safePause() async {
    try {
      await _playerController.pause();
    } catch (_) {
      // Ignore pause races while switching sources.
    }
  }

  Future<void> _safePlay() async {
    try {
      await _playerController.play();
    } catch (_) {
      // Ignore play races while switching sources.
    }
  }

  void _maybeShrinkWindow() {
    if (!Platform.isAndroid) {
      return;
    }

    final meminfo = File('/proc/meminfo');
    if (!meminfo.existsSync()) {
      return;
    }

    final text = meminfo.readAsStringSync();
    final match = RegExp(r'MemTotal:\s+(\d+)').firstMatch(text);
    if (match == null) {
      return;
    }

    final totalMb = (int.parse(match.group(1)!) / 1024).round();
    if (totalMb < 3000) {
      _preCache.windowSize = 2;
    }
  }
}
