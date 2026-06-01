import 'package:firebase_auth/firebase_auth.dart' as fb;

abstract class AuthGateway {
  Stream<fb.User?> authStateChanges();
  fb.User? get currentUser;
  Future<fb.User> signInWithEmail(String email, String password);
  Future<fb.User> registerWithEmail(String email, String password);
  Future<fb.User> signInWithGoogle();
  Future<void> sendPasswordReset(String email);
  Future<void> signOut();
  Future<void> sendEmailVerification();
}
