import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/error/friendly_error.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../application/discover_notifier.dart';
import 'category_tabs.dart';
import 'series_card.dart';

class DiscoverPage extends ConsumerWidget {
  const DiscoverPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(discoverNotifierProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Discover')),
      body: async.when(
        loading: () => const LoadingView(),
        error: (error, _) => ErrorView(
          error: friendlyErrorFor(error),
          onRetry: () => ref.invalidate(discoverNotifierProvider),
        ),
        data: (state) => Column(
          children: [
            const SizedBox(height: 8),
            CategoryTabs(
              current: state.currentCategory,
              onSelect: (category) => ref
                  .read(discoverNotifierProvider.notifier)
                  .selectCategory(category),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: GridView.builder(
                padding: const EdgeInsets.all(12),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: 9 / 16,
                ),
                itemCount: state.series.length,
                itemBuilder: (_, index) => SeriesCard(
                  series: state.series[index],
                  onTap: () => context.push('/series/${state.series[index].id}'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
