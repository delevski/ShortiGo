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
import 'data/iap/revenuecat_iap_gateway.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  env = Env.fromDefines();
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
    final iap = RevenueCatIapGateway();
    await iap.initialize(
      appleApiKey: env.revenueCatApiKeyIos,
      googleApiKey: env.revenueCatApiKeyAndroid,
    );
  });
}

Future<void> _onAuthStateChanged(fb.User? user) async {
  if (user == null) {
    return;
  }

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
