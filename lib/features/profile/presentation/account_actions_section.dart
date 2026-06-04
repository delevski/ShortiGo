import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

class AccountActionsSection extends StatelessWidget {
  const AccountActionsSection({
    required this.isDeleting,
    required this.onRestorePurchases,
    required this.onDeleteAccount,
    this.error,
    super.key,
  });

  final bool isDeleting;
  final VoidCallback onRestorePurchases;
  final Future<void> Function() onDeleteAccount;
  final String? error;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text(
          'Account & Subscription',
          style: TextStyle(color: AppColors.textSecondary),
        ),
        const SizedBox(height: 8),
        ListTile(
          contentPadding: EdgeInsets.zero,
          leading: const Icon(Icons.restore),
          title: const Text('Restore purchases'),
          onTap: onRestorePurchases,
        ),
        ListTile(
          contentPadding: EdgeInsets.zero,
          leading: const Icon(Icons.delete_outline, color: AppColors.error),
          title: const Text(
            'Delete account',
            style: TextStyle(color: AppColors.error),
          ),
          trailing: isDeleting
              ? const SizedBox.square(
                  dimension: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : null,
          onTap: isDeleting ? null : () => _confirmDelete(context),
        ),
        if (error != null)
          Text(error!, style: const TextStyle(color: AppColors.error)),
      ],
    );
  }

  Future<void> _confirmDelete(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete your ShortiGo account?'),
        content: const Text(
          'Your profile, My List, and viewing activity will be permanently '
          'deleted. Your transaction history is retained for fraud prevention '
          'and financial recordkeeping.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            style: FilledButton.styleFrom(backgroundColor: AppColors.error),
            child: const Text('Delete account'),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      await onDeleteAccount();
    }
  }
}
