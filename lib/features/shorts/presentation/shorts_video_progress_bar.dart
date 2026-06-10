import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

/// Thin playback progress with a soft glow, shown at the top of Shorts videos.
class ShortsVideoProgressBar extends StatelessWidget {
  const ShortsVideoProgressBar({
    super.key,
    required this.progress,
    this.visible = true,
  });

  /// Normalized playback position in `[0, 1]`.
  final double progress;
  final bool visible;

  @override
  Widget build(BuildContext context) {
    final topPadding = MediaQuery.paddingOf(context).top;
    final target = visible ? progress.clamp(0.0, 1.0) : 0.0;

    return IgnorePointer(
      child: AnimatedOpacity(
        opacity: visible ? 1 : 0,
        duration: const Duration(milliseconds: 220),
        child: Padding(
          padding: EdgeInsets.only(top: topPadding + 8, left: 16, right: 16),
          child: SizedBox(
            height: 1.5,
            child: LayoutBuilder(
              builder: (context, constraints) {
                return TweenAnimationBuilder<double>(
                  // Smoothly interpolate between progress samples.
                  tween: Tween<double>(begin: 0, end: target),
                  duration: const Duration(milliseconds: 280),
                  curve: Curves.linear,
                  builder: (context, value, _) {
                    final fillWidth = constraints.maxWidth * value;

                    return Stack(
                      clipBehavior: Clip.none,
                      children: [
                        DecoratedBox(
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.14),
                            borderRadius: BorderRadius.circular(1),
                          ),
                          child: const SizedBox.expand(),
                        ),
                        if (fillWidth > 0)
                          Positioned(
                            left: 0,
                            top: -0.75,
                            bottom: -0.75,
                            width: fillWidth,
                            child: DecoratedBox(
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(1.5),
                                gradient: const LinearGradient(
                                  colors: [
                                    AppColors.primaryLight,
                                    AppColors.accent,
                                  ],
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: AppColors.primary
                                        .withValues(alpha: 0.6),
                                    blurRadius: 6,
                                    spreadRadius: 0.2,
                                  ),
                                  BoxShadow(
                                    color: AppColors.accent
                                        .withValues(alpha: 0.4),
                                    blurRadius: 10,
                                    spreadRadius: 0.4,
                                  ),
                                ],
                              ),
                            ),
                          ),
                      ],
                    );
                  },
                );
              },
            ),
          ),
        ),
      ),
    );
  }
}
