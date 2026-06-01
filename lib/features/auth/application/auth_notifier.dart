import 'package:firebase_auth/firebase_auth.dart' as fb;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../../../core/providers.dart';

class AuthState {
  const AuthState({
    this.user,
    this.isLoading = false,
    this.error,
  });

  final fb.User? user;
  final bool isLoading;
  final String? error;
}

class AuthNotifier extends AsyncNotifier<AuthState> {
  @override
  Future<AuthState> build() async {
    final auth = ref.watch(currentAuthUserProvider).value;
    return AuthState(user: auth);
  }

  Future<void> signInWithEmail(String email, String password) async {
    state = const AsyncLoading<AuthState>().copyWithPrevious(state);
    try {
      final cred = await ref
          .read(firebaseAuthProvider)
          .signInWithEmailAndPassword(email: email, password: password);
      state = AsyncData(AuthState(user: cred.user));
    } catch (error) {
      state = AsyncData(AuthState(error: error.toString()));
    }
  }

  Future<void> registerWithEmail(String email, String password) async {
    state = const AsyncLoading<AuthState>().copyWithPrevious(state);
    try {
      final cred = await ref
          .read(firebaseAuthProvider)
          .createUserWithEmailAndPassword(email: email, password: password);
      await cred.user?.sendEmailVerification();
      state = AsyncData(AuthState(user: cred.user));
    } catch (error) {
      state = AsyncData(AuthState(error: error.toString()));
    }
  }

  Future<void> signInWithGoogle() async {
    state = const AsyncLoading<AuthState>().copyWithPrevious(state);
    try {
      final googleUser = await GoogleSignIn().signIn();
      if (googleUser == null) {
        state = AsyncData(
          AuthState(user: ref.read(currentAuthUserProvider).value),
        );
        return;
      }

      final googleAuth = await googleUser.authentication;
      final credential = fb.GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );
      final cred =
          await ref.read(firebaseAuthProvider).signInWithCredential(credential);
      state = AsyncData(AuthState(user: cred.user));
    } catch (error) {
      state = AsyncData(AuthState(error: error.toString()));
    }
  }

  Future<void> signOut() async {
    await ref.read(firebaseAuthProvider).signOut();
    state = const AsyncData(AuthState());
  }
}

final authNotifierProvider = AsyncNotifierProvider<AuthNotifier, AuthState>(
  AuthNotifier.new,
);
