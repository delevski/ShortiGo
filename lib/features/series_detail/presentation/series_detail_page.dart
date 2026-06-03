import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/providers.dart';
import '../../../core/error/friendly_error.dart';
import '../../../core/theme/app_colors.dart';
import '../../../domain/entities/user.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../application/series_detail_notifier.dart';

class SeriesDetailPage extends ConsumerWidget {
  const SeriesDetailPage({super.key, required this.seriesId});

  final String seriesId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(seriesDetailNotifierProvider(seriesId));

    return Scaffold(
      body: async.when(
        loading: () => const LoadingView(),
        error: (error, _) => ErrorView(
          error: friendlyErrorFor(error),
          onRetry: () => ref.invalidate(seriesDetailNotifierProvider(seriesId)),
        ),
        data: (state) {
          final series = state.series;
          if (series == null) {
            return const Center(child: Text('Series not found'));
          }

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(seriesDetailNotifierProvider(seriesId));
              await ref.read(seriesDetailNotifierProvider(seriesId).future);
            },
            child: CustomScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              slivers: [
                SliverAppBar(
                  expandedHeight: 320,
                  pinned: true,
                  backgroundColor: AppColors.bg,
                  flexibleSpace: FlexibleSpaceBar(
                    background: Stack(
                      fit: StackFit.expand,
                      children: [
                        CachedNetworkImage(
                          imageUrl: series.coverUrl,
                          fit: BoxFit.cover,
                        ),
                        const DecoratedBox(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [Colors.transparent, AppColors.bg],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          series.title,
                          style: Theme.of(context).textTheme.headlineSmall,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${series.episodeCount} EP - '
                          '${series.category.displayName}',
                          style:
                              const TextStyle(color: AppColors.textSecondary),
                        ),
                        const SizedBox(height: 8),
                        Text(series.description),
                        const SizedBox(height: 16),
                        _SaveSeriesButton(seriesId: series.id),
                      ],
                    ),
                  ),
                ),
                SliverList.builder(
                  itemCount: state.episodes.length,
                  itemBuilder: (_, index) {
                    final episode = state.episodes[index];

                    return ListTile(
                      leading: SizedBox(
                        width: 64,
                        height: 64,
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: CachedNetworkImage(
                            imageUrl: episode.thumbnailUrl,
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                      title: Text('EP.${episode.order}'),
                      subtitle: Text('${episode.durationSec}s'),
                      trailing: episode.isVipLocked
                          ? const Icon(Icons.lock, color: AppColors.vipGold)
                          : const Icon(Icons.play_circle_outline),
                      onTap: () {
                        if (episode.isVipLocked) {
                          context.push('/subscribe');
                          return;
                        }
                        context.push('/player/$seriesId/${episode.id}');
                      },
                    );
                  },
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _SaveSeriesButton extends ConsumerWidget {
  const _SaveSeriesButton({required this.seriesId});

  final String seriesId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentAppUserDocProvider).value;
    final isSaved = user?.favoriteSeriesIds.contains(seriesId) ?? false;

    return FilledButton.icon(
      onPressed: () => _toggleSaved(context, ref, user, isSaved),
      icon: Icon(isSaved ? Icons.bookmark : Icons.bookmark_outline),
      label: Text(isSaved ? 'Saved' : 'Save'),
    );
  }

  Future<void> _toggleSaved(
    BuildContext context,
    WidgetRef ref,
    AppUser? user,
    bool isSaved,
  ) async {
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
}
