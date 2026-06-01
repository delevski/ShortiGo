import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/error/friendly_error.dart';
import '../../../core/providers.dart';
import '../application/auth_notifier.dart';

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _isRegister = false;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(authNotifierProvider);

    return Scaffold(
      appBar: AppBar(title: Text(_isRegister ? 'Create account' : 'Sign in')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 24),
            TextField(
              controller: _email,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(labelText: 'Email'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _password,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'Password'),
            ),
            const SizedBox(height: 24),
            async.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, _) => Text(
                friendlyErrorFor(error).message,
                style: const TextStyle(color: Colors.redAccent),
              ),
              data: (state) => state.error != null
                  ? Text(
                      state.error!,
                      style: const TextStyle(color: Colors.redAccent),
                    )
                  : const SizedBox.shrink(),
            ),
            FilledButton(
              onPressed: _submit,
              child: Text(_isRegister ? 'Create account' : 'Sign in'),
            ),
            const SizedBox(height: 8),
            OutlinedButton(
              onPressed: _signInWithGoogle,
              child: const Text('Continue with Google'),
            ),
            TextButton(
              onPressed: () => setState(() => _isRegister = !_isRegister),
              child: Text(
                _isRegister ? 'I have an account' : 'Create a new account',
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submit() async {
    final notifier = ref.read(authNotifierProvider.notifier);
    if (_isRegister) {
      await notifier.registerWithEmail(_email.text.trim(), _password.text);
    } else {
      await notifier.signInWithEmail(_email.text.trim(), _password.text);
    }
    _goHomeIfSignedIn();
  }

  Future<void> _signInWithGoogle() async {
    await ref.read(authNotifierProvider.notifier).signInWithGoogle();
    _goHomeIfSignedIn();
  }

  void _goHomeIfSignedIn() {
    if (!mounted) {
      return;
    }
    if (ref.read(currentAuthUserProvider).value != null ||
        ref.read(authNotifierProvider).value?.user != null) {
      context.go('/discover');
    }
  }
}
