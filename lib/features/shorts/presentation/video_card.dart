import 'package:flutter/material.dart';

import '../../../domain/entities/episode.dart';

/// Loading/error overlay for a Shorts page. Video playback is handled by [ShortsPage].
class VideoCard extends StatelessWidget {
  const VideoCard({
    super.key,
    required this.episode,
    required this.isActive,
    required this.isLoading,
    required this.hasError,
    required this.onRetry,
  });

  final Episode episode;
  final bool isActive;
  final bool isLoading;
  final bool hasError;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        if (isActive && hasError)
          ColoredBox(
            color: Colors.black,
            child: Center(
              child: FilledButton(
                onPressed: onRetry,
                child: const Text('Tap to retry'),
              ),
            ),
          )
        else if (isActive && isLoading)
          const ColoredBox(
            color: Colors.black,
            child: Center(child: CircularProgressIndicator()),
          ),
      ],
    );
  }
}
