import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/error/friendly_error.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../discover/presentation/series_card.dart';
import '../application/my_list_notifier.dart';

class MyListPage extends ConsumerWidget {
  const MyListPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(myListNotifierProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('My List')),
      body: async.when(
        loading: () => const LoadingView(),
        error: (error, _) => ErrorView(
          error: friendlyErrorFor(error),
          onRetry: () => ref.invalidate(myListNotifierProvider),
        ),
        data: (state) {
          if (state.series.isEmpty) {
            return const _EmptyMyList();
          }

          return GridView.builder(
            padding: const EdgeInsets.all(12),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 9 / 16,
            ),
            itemCount: state.series.length,
            itemBuilder: (_, index) {
              final series = state.series[index];
              return SeriesCard(
                series: series,
                onTap: () => context.push('/series/${series.id}'),
              );
            },
          );
        },
      ),
    );
  }
}

class _EmptyMyList extends StatelessWidget {
  const _EmptyMyList();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Padding(
        padding: EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.bookmark_outline, size: 44),
            SizedBox(height: 12),
            Text(
              'No saved series yet',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
              ),
            ),
            SizedBox(height: 6),
            Text(
              'Save a series and it will appear here.',
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
