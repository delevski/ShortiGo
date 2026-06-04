import 'package:firebase_auth/firebase_auth.dart' as fb;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/error/friendly_error.dart';
import '../../../core/theme/app_colors.dart';
import '../../../domain/entities/transaction.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../subscription/application/subscription_notifier.dart';
import '../application/account_deletion_notifier.dart';
import '../application/profile_notifier.dart';
import 'account_actions_section.dart';

class ProfilePage extends ConsumerWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(profileNotifierProvider);
    final deletion = ref.watch(accountDeletionNotifierProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: async.when(
        loading: () => const LoadingView(),
        error: (error, _) => ErrorView(
          error: friendlyErrorFor(error),
          onRetry: () => ref.invalidate(profileNotifierProvider),
        ),
        data: (state) {
          final user = state.user;
          if (user == null) {
            return const Center(child: Text('Sign in to view profile'));
          }

          final initial = _initialFor(user.displayName ?? user.email);

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Row(
                children: [
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: AppColors.surface,
                    backgroundImage:
                        user.photoUrl != null && user.photoUrl!.isNotEmpty
                            ? NetworkImage(user.photoUrl!)
                            : null,
                    child: user.photoUrl == null || user.photoUrl!.isEmpty
                        ? Text(initial)
                        : null,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user.displayName ?? user.email,
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        Text(
                          user.email,
                          style: const TextStyle(
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _WalletCell(label: 'Coins', value: user.coins),
                      _WalletCell(label: 'Bonus', value: user.bonus),
                      _WalletCell(
                        label: 'VIP',
                        value: user.isVip ? 'Yes' : 'No',
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              if (state.transactions.isNotEmpty) ...[
                const Text(
                  'Recent transactions',
                  style: TextStyle(color: AppColors.textSecondary),
                ),
                const SizedBox(height: 8),
                ...state.transactions.take(10).map(
                      (transaction) => ListTile(
                        dense: true,
                        leading: Icon(
                          _iconFor(transaction.type),
                          color: AppColors.primary,
                        ),
                        title: Text(transaction.type.name),
                        trailing: Text(
                          '+${transaction.coinsDelta}c / '
                          '+${transaction.bonusDelta}b',
                        ),
                      ),
                    ),
              ],
              if (!user.isVip) ...[
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: () => context.push('/subscribe'),
                  child: const Text('Get VIP'),
                ),
              ],
              const SizedBox(height: 16),
              AccountActionsSection(
                isDeleting: deletion.isDeleting,
                error: deletion.error,
                onRestorePurchases: () async {
                  await ref
                      .read(subscriptionNotifierProvider.notifier)
                      .restorePurchases();
                  if (!context.mounted) {
                    return;
                  }
                  final result =
                      ref.read(subscriptionNotifierProvider).valueOrNull;
                  final message = result?.message ?? result?.error;
                  if (message != null) {
                    ScaffoldMessenger.of(context)
                        .showSnackBar(SnackBar(content: Text(message)));
                  }
                },
                onDeleteAccount: () async {
                  final deleted = await ref
                      .read(accountDeletionNotifierProvider.notifier)
                      .deleteAccount();
                  if (deleted && context.mounted) {
                    context.go('/onboarding');
                  }
                },
              ),
              const SizedBox(height: 16),
              FilledButton.tonal(
                onPressed: () async => fb.FirebaseAuth.instance.signOut(),
                child: const Text('Sign out'),
              ),
            ],
          );
        },
      ),
    );
  }

  static String _initialFor(String value) {
    if (value.isEmpty) {
      return '?';
    }
    return value.substring(0, 1).toUpperCase();
  }

  static IconData _iconFor(TxType type) {
    return switch (type) {
      TxType.adReward => Icons.bolt,
      TxType.dailyCheckIn => Icons.calendar_today,
      TxType.purchase => Icons.shopping_cart,
      TxType.spend => Icons.remove_circle,
      TxType.refund => Icons.undo,
    };
  }
}

class _WalletCell extends StatelessWidget {
  const _WalletCell({
    required this.label,
    required this.value,
  });

  final String label;
  final Object value;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          '$value',
          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700),
        ),
        Text(label, style: const TextStyle(color: AppColors.textSecondary)),
      ],
    );
  }
}
