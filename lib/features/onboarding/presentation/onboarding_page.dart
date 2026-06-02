import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/error/friendly_error.dart';
import '../../../domain/entities/category.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../discover/presentation/category_tabs.dart';
import '../../discover/presentation/series_card.dart';
import '../application/onboarding_preview_notifier.dart';

class OnboardingPage extends ConsumerWidget {
  const OnboardingPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(onboardingPreviewNotifierProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Preview ShortiGo'),
        actions: [
          TextButton(
            onPressed: () => context.go('/login'),
            child: const Text('Sign in'),
          ),
        ],
      ),
      body: async.when(
        loading: () => const LoadingView(),
        error: (error, _) => ErrorView(
          error: friendlyErrorFor(error),
          onRetry: () => ref.invalidate(onboardingPreviewNotifierProvider),
        ),
        data: (state) => Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Short dramas before you sign up',
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Browse categories, then sign in when you are ready to watch.',
                  ),
                  const SizedBox(height: 12),
                  FilledButton(
                    onPressed: () => context.go('/login'),
                    child: const Text('Create account or sign in'),
                  ),
                ],
              ),
            ),
            CategoryTabs(
              current: state.currentCategory,
              onSelect: (Category category) => ref
                  .read(onboardingPreviewNotifierProvider.notifier)
                  .selectCategory(category),
            ),
            const SizedBox(height: 8),
            Expanded(
              child: state.series.isEmpty
                  ? const _EmptyPreview()
                  : GridView.builder(
                      padding: const EdgeInsets.all(12),
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
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
                          onTap: () => context.go('/login'),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyPreview extends StatelessWidget {
  const _EmptyPreview();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Padding(
        padding: EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.movie_filter_outlined, size: 44),
            SizedBox(height: 12),
            Text(
              'No previews yet',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
              ),
            ),
            SizedBox(height: 6),
            Text(
              'Check back soon for fresh short dramas.',
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
