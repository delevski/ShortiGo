import 'package:firebase_auth/firebase_auth.dart' as fb;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:shortigo/core/providers.dart';
import 'package:shortigo/domain/interfaces/user_repository.dart';
import 'package:shortigo/features/profile/application/account_deletion_notifier.dart';

class _MockFirebaseAuth extends Mock implements fb.FirebaseAuth {}

class _MockFirebaseUser extends Mock implements fb.User {}

class _MockUserMetadata extends Mock implements fb.UserMetadata {}

class _MockUserRepository extends Mock implements UserRepository {}

void main() {
  test('stale authentication is rejected before personal data is deleted',
      () async {
    final auth = _MockFirebaseAuth();
    final user = _MockFirebaseUser();
    final metadata = _MockUserMetadata();
    final repository = _MockUserRepository();
    when(() => auth.currentUser).thenReturn(user);
    when(() => user.metadata).thenReturn(metadata);
    when(() => metadata.lastSignInTime).thenReturn(
      DateTime.now().subtract(const Duration(minutes: 10)),
    );
    final container = ProviderContainer(
      overrides: [
        firebaseAuthProvider.overrideWithValue(auth),
        userRepositoryProvider.overrideWithValue(repository),
      ],
    );
    addTearDown(container.dispose);

    final deleted = await container
        .read(accountDeletionNotifierProvider.notifier)
        .deleteAccount();

    expect(deleted, isFalse);
    expect(
      container.read(accountDeletionNotifierProvider).error,
      contains('sign out and sign in again'),
    );
    verifyNever(() => repository.deletePersonalData(any()));
    verifyNever(user.delete);
  });
}
