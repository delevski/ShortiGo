import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart' as fb;
import 'package:firebase_performance/firebase_performance.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/services.dart';
import 'package:sentry_flutter/sentry_flutter.dart';

import 'app.dart';
import 'bootstrap/firebase_bootstrap.dart';
import 'core/env/env.dart';
import 'core/router/app_router.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
  ]);
  env = Env.fromDefines();
  if (env.hasReleaseBlockingIssues) {
    debugPrint(
      'ShortiGo release blockers:\n'
      '${env.releaseBlockingIssues.map((issue) => '- $issue').join('\n')}',
    );
  }
  await FirebaseBootstrap.initialize();
  unawaited(
    FirebasePerformance.instance.setPerformanceCollectionEnabled(true),
  );
  SystemChannels.system.setMessageHandler((message) async {
    if (message == 'memoryPressure') {
      debugPrint('Memory pressure warning received');
    }
    return null;
  });
  fb.FirebaseAuth.instance.authStateChanges().listen(_onAuthStateChanged);
  runApp(
    ProviderScope(
      child: ShortiGoApp(router: buildRouter(requireAuth: true)),
    ),
  );

  WidgetsBinding.instance.addPostFrameCallback((_) async {
    if (env.sentryDsn.isNotEmpty) {
      await SentryFlutter.init((options) {
        options.dsn = env.sentryDsn;
      });
    }
  });
}

Future<void> _onAuthStateChanged(fb.User? user) async {
  if (user == null) {
    return;
  }

  // A transient Firestore error here (e.g. a permission-denied race while
  // the auth token settles right after sign-in) must never crash the app:
  // the user doc is created on the next auth event or app start instead.
  try {
    await _ensureUserDoc(user);
  } catch (error, stackTrace) {
    debugPrint('User doc bootstrap failed, will retry on next auth event: $error');
    if (env.sentryDsn.isNotEmpty) {
      await Sentry.captureException(error, stackTrace: stackTrace);
    }
  }
}

Future<void> _ensureUserDoc(fb.User user) async {
  final db = FirebaseFirestore.instance;
  final ref = db.collection('users').doc(user.uid);
  final snap = await ref.get();
  if (snap.exists) {
    return;
  }

  await ref.set({
    'id': user.uid,
    'email': user.email ?? '',
    'displayName': user.displayName,
    'photoUrl': user.photoURL,
    'coins': 0,
    'bonus': 0,
    'isVip': false,
    'favoriteSeriesIds': <String>[],
    'createdAt': FieldValue.serverTimestamp(),
  });
}
