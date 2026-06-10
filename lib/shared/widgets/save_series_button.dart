import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers.dart';
import '../../core/theme/app_colors.dart';
import '../../domain/entities/user.dart';

Future<void> toggleSeriesSaved({
  required BuildContext context,
  required WidgetRef ref,
  required String seriesId,
  required AppUser? user,
  required bool isSaved,
}) async {
  if (user == null) {
    unawaited(context.push('/login'));
    return;
  }

  final repo = ref.read(userRepositoryProvider);
  if (isSaved) {
    await repo.unsaveSeries(userId: user.id, seriesId: seriesId);
  } else {
    await repo.saveSeries(userId: user.id, seriesId: seriesId);
  }
}

/// Full-width save button for series detail.
class SaveSeriesFilledButton extends ConsumerWidget {
  const SaveSeriesFilledButton({super.key, required this.seriesId});

  final String seriesId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentAppUserDocProvider).value;
    final isSaved = user?.favoriteSeriesIds.contains(seriesId) ?? false;

    return FilledButton.icon(
      onPressed: () => toggleSeriesSaved(
        context: context,
        ref: ref,
        seriesId: seriesId,
        user: user,
        isSaved: isSaved,
      ),
      icon: Icon(isSaved ? Icons.bookmark : Icons.bookmark_outline),
      label: Text(isSaved ? 'Saved' : 'Save'),
    );
  }
}

/// Circular glass save control for Shorts info panel.
class SaveSeriesCircleButton extends ConsumerWidget {
  const SaveSeriesCircleButton({super.key, required this.seriesId});

  final String seriesId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentAppUserDocProvider).value;
    final isSaved = user?.favoriteSeriesIds.contains(seriesId) ?? false;

    return _GlassActionButton(
      icon: isSaved ? Icons.bookmark : Icons.bookmark_border,
      label: 'SAVE',
      onPressed: () => toggleSeriesSaved(
        context: context,
        ref: ref,
        seriesId: seriesId,
        user: user,
        isSaved: isSaved,
      ),
    );
  }
}

/// Circular glass action button (Save / Details style).
class GlassActionButton extends StatelessWidget {
  const GlassActionButton({
    super.key,
    required this.icon,
    required this.label,
    required this.onPressed,
  });

  final IconData icon;
  final String label;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return _GlassActionButton(icon: icon, label: label, onPressed: onPressed);
  }
}

class _GlassActionButton extends StatelessWidget {
  const _GlassActionButton({
    required this.icon,
    required this.label,
    required this.onPressed,
  });

  final IconData icon;
  final String label;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(32),
        child: SizedBox(
          width: 64,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withValues(alpha: 0.14),
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.2),
                  ),
                ),
                child: Icon(icon, color: Colors.white, size: 22),
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: const TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
