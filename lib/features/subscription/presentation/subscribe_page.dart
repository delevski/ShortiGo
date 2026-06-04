import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/error/friendly_error.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../application/subscription_notifier.dart';

class SubscribePage extends ConsumerWidget {
  const SubscribePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(subscriptionNotifierProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Subscribe to VIP')),
      body: async.when(
        loading: () => const LoadingView(),
        error: (error, _) => ErrorView(
          error: friendlyErrorFor(error),
          onRetry: () => ref.invalidate(subscriptionNotifierProvider),
        ),
        data: (state) {
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppColors.vipGold, AppColors.accent],
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'VIP Membership',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    SizedBox(height: 8),
                    Text(
                      'Ad-free, 1080p, exclusive VIP series.',
                      style: TextStyle(color: Colors.white70),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              if (state.offerings.isEmpty)
                const Padding(
                  padding: EdgeInsets.all(16),
                  child: Text(
                    'No offerings available right now.',
                    style: TextStyle(color: AppColors.textSecondary),
                  ),
                )
              else
                ...state.offerings.expand((offering) => offering.packages).map(
                      (package) => Card(
                        child: ListTile(
                          title: Text(package.identifier),
                          trailing: Text(
                            package.priceString,
                            style: const TextStyle(
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          onTap: () {
                            ref
                                .read(subscriptionNotifierProvider.notifier)
                                .purchase(package.identifier);
                          },
                        ),
                      ),
                    ),
              const SizedBox(height: 12),
              TextButton.icon(
                onPressed: state.isLoading
                    ? null
                    : () {
                        ref
                            .read(subscriptionNotifierProvider.notifier)
                            .restorePurchases();
                      },
                icon: const Icon(Icons.restore),
                label: const Text('Restore purchases'),
              ),
              if (state.message != null) ...[
                const SizedBox(height: 12),
                Text(
                  state.message!,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: AppColors.textSecondary),
                ),
              ],
              if (state.error != null) ...[
                const SizedBox(height: 12),
                Text(
                  state.error!,
                  style: const TextStyle(color: AppColors.error),
                ),
              ],
            ],
          );
        },
      ),
    );
  }
}
