import 'package:better_player_plus/better_player_plus.dart';
import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../domain/entities/episode.dart';

class VideoCard extends StatefulWidget {
  const VideoCard({
    super.key,
    required this.episode,
    required this.controller,
    required this.isActive,
    required this.onTapSeries,
  });

  final Episode episode;
  final BetterPlayerController? controller;
  final bool isActive;
  final VoidCallback onTapSeries;

  @override
  State<VideoCard> createState() => _VideoCardState();
}

class _VideoCardState extends State<VideoCard> {
  bool _hasError = false;

  @override
  void initState() {
    super.initState();
    _attachController(widget.controller);
    if (widget.isActive) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        widget.controller?.play();
      });
    }
  }

  @override
  void didUpdateWidget(covariant VideoCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.controller != widget.controller) {
      _detachController(oldWidget.controller);
      _attachController(widget.controller);
      _hasError = false;
    }

    if (widget.isActive && widget.controller != null) {
      widget.controller!.play();
    } else if (!widget.isActive && widget.controller != null) {
      widget.controller!.pause();
    }
  }

  @override
  Widget build(BuildContext context) {
    final controller = widget.controller;

    return Container(
      color: Colors.black,
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (_hasError)
            Center(
              child: FilledButton(
                onPressed: () => setState(() => _hasError = false),
                child: const Text('Tap to retry'),
              ),
            )
          else if (controller != null)
            Positioned.fill(
              child: BetterPlayer(controller: controller),
            )
          else
            const Center(child: CircularProgressIndicator()),
          Positioned(
            left: 16,
            right: 80,
            bottom: 24,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'EP.${widget.episode.order}',
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 4),
                GestureDetector(
                  onTap: widget.onTapSeries,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.surface.withValues(alpha: 0.7),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Text(
                      'Open series',
                      style: TextStyle(color: Colors.white, fontSize: 12),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _detachController(widget.controller);
    super.dispose();
  }

  void _attachController(BetterPlayerController? controller) {
    controller?.addEventsListener(_onPlayerEvent);
  }

  void _detachController(BetterPlayerController? controller) {
    controller?.removeEventsListener(_onPlayerEvent);
  }

  void _onPlayerEvent(BetterPlayerEvent event) {
    if (event.betterPlayerEventType == BetterPlayerEventType.exception &&
        mounted) {
      setState(() => _hasError = true);
    }
  }
}
