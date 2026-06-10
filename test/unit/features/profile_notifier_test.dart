import 'dart:async';

import 'package:firebase_auth/firebase_auth.dart' as fb;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:shortigo/core/providers.dart';
import 'package:shortigo/domain/entities/transaction.dart';
import 'package:shortigo/domain/entities/user.dart';
import 'package:shortigo/domain/interfaces/transaction_repository.dart';
import 'package:shortigo/domain/interfaces/user_repository.dart';
import 'package:shortigo/features/profile/application/profile_notifier.dart';

class _MockFirebaseUser extends Mock implements fb.User {}

class _MockTransactionRepository extends Mock
    implements TransactionRepository {}

class _MockUserRepository extends Mock implements UserRepository {}

void main() {
  test('keeps the latest live user when transactions update', () async {
    final authUser = _MockFirebaseUser();
    final userRepository = _MockUserRepository();
    final transactionRepository = _MockTransactionRepository();
    final userController = StreamController<AppUser>();
    final transactionController = StreamController<List<Transaction>>();
    addTearDown(userController.close);
    addTearDown(transactionController.close);

    when(() => authUser.uid).thenReturn('user-1');
    when(() => userRepository.watch('user-1'))
        .thenAnswer((_) => userController.stream);
    when(() => transactionRepository.watchForUser('user-1'))
        .thenAnswer((_) => transactionController.stream);

    final container = ProviderContainer(
      overrides: [
        currentAuthUserProvider.overrideWith((_) => Stream.value(authUser)),
        userRepositoryProvider.overrideWithValue(userRepository),
        transactionRepositoryProvider.overrideWithValue(transactionRepository),
      ],
    );
    addTearDown(container.dispose);
    await container.read(currentAuthUserProvider.future);
    final future = container.read(profileNotifierProvider.future);

    final initial = AppUser(
      id: 'user-1',
      email: 'viewer@example.com',
      bonus: 5,
      createdAt: DateTime.utc(2026, 6, 4),
    );
    userController.add(initial);
    await future;

    final updated = initial.copyWith(bonus: 17, isVip: true);
    userController.add(updated);
    transactionController.add([
      Transaction(
        id: 'tx-1',
        userId: 'user-1',
        type: TxType.adReward,
        coinsDelta: 0,
        bonusDelta: 12,
        at: DateTime.utc(2026, 6, 4),
      ),
    ]);
    await Future<void>.delayed(Duration.zero);

    final state = container.read(profileNotifierProvider).requireValue;
    expect(state.user, updated);
    expect(state.transactions, hasLength(1));
  });
}
