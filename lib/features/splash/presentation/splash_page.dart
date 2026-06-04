import 'dart:async';

import 'package:firebase_auth/firebase_auth.dart' as fb;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../bootstrap/app_warmup.dart';
import '../../../core/router/app_router.dart';
import 'shortigo_vortex_splash.dart';

/// Branded vortex splash shown on cold start before routing into the app.
class SplashPage extends ConsumerStatefulWidget {
  const SplashPage({super.key});

  static const Duration animationDuration = Duration(milliseconds: 1200);

  @override
  ConsumerState<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends ConsumerState<SplashPage>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.manual, overlays: []);
    _controller = AnimationController(
      vsync: this,
      duration: SplashPage.animationDuration,
    );
    startAppWarmup(ref);
    unawaited(_runSplash());
  }

  Future<void> _runSplash() async {
    await _controller.forward();
    if (!mounted) {
      return;
    }

    unawaited(SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge));
    context.go(_nextRouteAfterSplash());
  }

  String _nextRouteAfterSplash() {
    if (!splashRequireAuth) {
      return '/discover';
    }
    final loggedIn = splashIsLoggedIn?.call() ??
        fb.FirebaseAuth.instance.currentUser != null;
    return loggedIn ? '/discover' : '/onboarding';
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ShortiGoVortexSplash.background,
      body: AnimatedBuilder(
        animation: _controller,
        builder: (context, _) {
          return ShortiGoVortexSplash(progress: _controller.value);
        },
      ),
    );
  }
}
