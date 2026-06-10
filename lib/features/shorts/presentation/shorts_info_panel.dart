import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/providers.dart';
import '../../../core/theme/app_colors.dart';
import '../../../domain/entities/episode.dart';
import '../../../domain/entities/series.dart';
import '../../../shared/widgets/save_series_button.dart';

/// Frosted series info panel shown above the bottom nav on the Shorts tab.
class ShortsInfoPanel extends ConsumerWidget {
  const ShortsInfoPanel({
    super.key,
    required this.series,
    required this.episode,
    this.onCollapse,
  });

  final Series series;
  final Episode episode;

  /// Invoked when the user swipes the panel to the right to collapse it.
  final VoidCallback? onCollapse;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final description = series.description.trim();

    return GestureDetector(
      behavior: HitTestBehavior.deferToChild,
      onHorizontalDragEnd: (details) {
        final velocity = details.primaryVelocity ?? 0;
        if (velocity > 250) {
          onCollapse?.call();
        }
      },
      child: Padding(
        padding: const EdgeInsets.fromLTRB(12, 0, 12, 8),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: Colors.white.withValues(alpha: 0.12),
                ),
              ),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _CollapseHandle(onCollapse: onCollapse),
                    Text(
                      series.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                        height: 1.2,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'EP.${episode.order}',
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    if (description.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      _DescriptionPreview(
                        description: description,
                        onReadMore: () =>
                            _showDescriptionSheet(context, series),
                      ),
                    ],
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        SaveSeriesCircleButton(seriesId: series.id),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _WatchNowButton(
                            seriesId: series.id,
                            episode: episode,
                          ),
                        ),
                        const SizedBox(width: 8),
                        GlassActionButton(
                          icon: Icons.info_outline,
                          label: 'DETAILS',
                          onPressed: () =>
                              context.push('/series/${series.id}'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _showDescriptionSheet(BuildContext context, Series series) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  series.title,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: AppColors.textPrimary,
                      ),
                ),
                const SizedBox(height: 12),
                ConstrainedBox(
                  constraints: BoxConstraints(
                    maxHeight: MediaQuery.sizeOf(context).height * 0.5,
                  ),
                  child: SingleChildScrollView(
                    child: Text(
                      series.description,
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        height: 1.45,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

/// Circular ripple reveal that grows/collapses from the bottom-right corner,
/// where the [SeriesInfoFab] sits. Combined with a fade for a smooth feel.
class ShortsPanelReveal extends StatelessWidget {
  const ShortsPanelReveal({
    super.key,
    required this.animation,
    required this.child,
  });

  final Animation<double> animation;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final curved = CurvedAnimation(
      parent: animation,
      curve: Curves.easeOutCubic,
      reverseCurve: Curves.easeInCubic,
    );

    return FadeTransition(
      opacity: curved,
      child: AnimatedBuilder(
        animation: curved,
        builder: (context, child) {
          return ClipPath(
            clipper: _CornerRevealClipper(curved.value),
            child: child,
          );
        },
        child: child,
      ),
    );
  }
}

class _CornerRevealClipper extends CustomClipper<Path> {
  const _CornerRevealClipper(this.fraction);

  final double fraction;

  @override
  Path getClip(Size size) {
    // Origin near the FAB center (bottom-right, accounting for 16/22 insets).
    final center = Offset(size.width - 41, size.height - 47);
    final maxRadius = size.longestSide * 1.25;
    final radius = (maxRadius * fraction).clamp(0.0, maxRadius);
    return Path()
      ..addOval(Rect.fromCircle(center: center, radius: radius));
  }

  @override
  bool shouldReclip(_CornerRevealClipper oldClipper) =>
      oldClipper.fraction != fraction;
}

/// Small grab handle hinting that the panel can be swiped right to collapse.
class _CollapseHandle extends StatelessWidget {
  const _CollapseHandle({this.onCollapse});

  final VoidCallback? onCollapse;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.topRight,
      child: GestureDetector(
        onTap: onCollapse,
        behavior: HitTestBehavior.opaque,
        child: Padding(
          padding: const EdgeInsets.only(bottom: 6, left: 12, top: 0),
          child: Icon(
            Icons.chevron_right,
            size: 20,
            color: Colors.white.withValues(alpha: 0.6),
          ),
        ),
      ),
    );
  }
}

/// Collapsed representation of [ShortsInfoPanel]; tap or swipe left to expand.
class SeriesInfoFab extends StatelessWidget {
  const SeriesInfoFab({
    super.key,
    required this.onExpand,
  });

  final VoidCallback onExpand;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onHorizontalDragEnd: (details) {
        final velocity = details.primaryVelocity ?? 0;
        if (velocity < -250) {
          onExpand();
        }
      },
      child: Material(
        color: Colors.transparent,
        shape: const CircleBorder(),
        child: InkWell(
          customBorder: const CircleBorder(),
          onTap: onExpand,
          child: ClipOval(
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
              child: Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withValues(alpha: 0.08),
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.18),
                    width: 0.8,
                  ),
                ),
                child: Icon(
                  Icons.chevron_left,
                  color: Colors.white.withValues(alpha: 0.85),
                  size: 26,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _DescriptionPreview extends StatelessWidget {
  const _DescriptionPreview({
    required this.description,
    required this.onReadMore,
  });

  final String description;
  final VoidCallback onReadMore;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Expanded(
          child: Text(
            description,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 13,
              height: 1.35,
            ),
          ),
        ),
        const SizedBox(width: 8),
        TextButton(
          onPressed: onReadMore,
          style: TextButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            minimumSize: Size.zero,
            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            backgroundColor: Colors.white.withValues(alpha: 0.12),
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
          child: const Text(
            'Read More',
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
          ),
        ),
      ],
    );
  }
}

class _WatchNowButton extends ConsumerWidget {
  const _WatchNowButton({
    required this.seriesId,
    required this.episode,
  });

  final String seriesId;
  final Episode episode;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => _onWatchNow(context, ref),
        borderRadius: BorderRadius.circular(28),
        child: Ink(
          height: 52,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(28),
            gradient: const LinearGradient(
              colors: [
                Color(0xFF7DD3FC),
                Color(0xFF38BDF8),
              ],
            ),
          ),
          child: const Center(
            child: Text(
              'WATCH NOW',
              style: TextStyle(
                color: Color(0xFF0C4A6E),
                fontSize: 14,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.6,
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _onWatchNow(BuildContext context, WidgetRef ref) {
    final user = ref.read(currentAppUserDocProvider).value;
    if (episode.isVipLocked && !(user?.isVip ?? false)) {
      context.push('/subscribe');
      return;
    }
    context.push('/player/$seriesId/${episode.id}');
  }
}
