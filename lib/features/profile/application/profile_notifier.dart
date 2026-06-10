import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers.dart';
import '../../../domain/entities/transaction.dart';
import '../../../domain/entities/user.dart';

class ProfileState {
  const ProfileState({
    this.user,
    this.transactions = const [],
  });

  final AppUser? user;
  final List<Transaction> transactions;
}

class ProfileNotifier extends AsyncNotifier<ProfileState> {
  StreamSubscription<List<Transaction>>? _txSub;
  StreamSubscription<AppUser>? _userSub;

  @override
  Future<ProfileState> build() async {
    final auth = ref.watch(currentAuthUserProvider).value;
    if (auth == null) {
      return const ProfileState();
    }

    final userRepo = ref.read(userRepositoryProvider);
    final txRepo = ref.read(transactionRepositoryProvider);
    final firstUser = Completer<AppUser>();
    var latestTransactions = const <Transaction>[];

    _userSub = userRepo.watch(auth.uid).listen(
      (user) {
        if (!firstUser.isCompleted) {
          firstUser.complete(user);
        }
        state = AsyncData(
          ProfileState(user: user, transactions: latestTransactions),
        );
      },
      onError: firstUser.completeError,
    );
    _txSub = txRepo.watchForUser(auth.uid).listen((transactions) {
      latestTransactions = transactions;
      state = AsyncData(
        ProfileState(user: state.value?.user, transactions: transactions),
      );
    });
    ref.onDispose(() {
      _userSub?.cancel();
      _txSub?.cancel();
    });

    return ProfileState(user: await firstUser.future);
  }
}

final profileNotifierProvider =
    AsyncNotifierProvider<ProfileNotifier, ProfileState>(
  ProfileNotifier.new,
);
