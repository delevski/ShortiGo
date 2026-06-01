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

  @override
  Future<ProfileState> build() async {
    final auth = ref.watch(currentAuthUserProvider).value;
    if (auth == null) {
      return const ProfileState();
    }

    final userRepo = ref.read(userRepositoryProvider);
    final txRepo = ref.read(transactionRepositoryProvider);
    final user = await userRepo.byId(auth.uid);

    _txSub = txRepo.watchForUser(auth.uid).listen((transactions) {
      state = AsyncData(
        ProfileState(user: user, transactions: transactions),
      );
    });
    ref.onDispose(() => _txSub?.cancel());

    return ProfileState(user: user);
  }
}

final profileNotifierProvider =
    AsyncNotifierProvider<ProfileNotifier, ProfileState>(
  ProfileNotifier.new,
);
