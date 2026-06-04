import 'package:firebase_auth/firebase_auth.dart' as fb;
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers.dart';

class AccountDeletionState {
  const AccountDeletionState({
    this.isDeleting = false,
    this.error,
  });

  final bool isDeleting;
  final String? error;
}

class AccountDeletionNotifier extends Notifier<AccountDeletionState> {
  static const _recentLoginWindow = Duration(minutes: 5);

  @override
  AccountDeletionState build() => const AccountDeletionState();

  Future<bool> deleteAccount() async {
    final user = ref.read(firebaseAuthProvider).currentUser;
    if (user == null) {
      state = const AccountDeletionState(error: 'Sign in again to continue.');
      return false;
    }

    final lastSignIn = user.metadata.lastSignInTime;
    if (lastSignIn == null ||
        DateTime.now().difference(lastSignIn) > _recentLoginWindow) {
      state = const AccountDeletionState(
        error: 'For your security, sign out and sign in again before deleting '
            'your account.',
      );
      return false;
    }

    state = const AccountDeletionState(isDeleting: true);
    try {
      await ref.read(userRepositoryProvider).deletePersonalData(user.uid);
      await user.delete();
      state = const AccountDeletionState();
      return true;
    } on fb.FirebaseAuthException catch (error) {
      final message = error.code == 'requires-recent-login'
          ? 'For your security, sign out and sign in again before deleting '
              'your account.'
          : error.message ?? 'Account deletion failed. Please try again.';
      state = AccountDeletionState(error: message);
      return false;
    } catch (error) {
      state = AccountDeletionState(error: error.toString());
      return false;
    }
  }
}

final accountDeletionNotifierProvider =
    NotifierProvider<AccountDeletionNotifier, AccountDeletionState>(
  AccountDeletionNotifier.new,
);
