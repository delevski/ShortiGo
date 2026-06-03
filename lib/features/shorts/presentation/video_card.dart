import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../domain/entities/episode.dart';

/// Metadata overlay for a Shorts page. Video playback is handled by [ShortsPage].
class VideoCard extends StatelessWidget {
  const VideoCard({
    super.key,
    required this.episode,
    required this.isActive,
    required this.isLoading,
    required this.hasError,
    required this.onRetry,
    required this.onTapSeries,
  });

  final Episode episode;
  final bool isActive;
  final bool isLoading;
  final bool hasError;
  final VoidCallback onRetry;
  final VoidCallback onTapSeries;

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
        Positioned(
            left: 16,
            right: 80,
            bottom: 24,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'EP.${episode.order}',
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 4),
                GestureDetector(
                  onTap: onTapSeries,
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
    );
  }
}
