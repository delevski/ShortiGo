import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart' as fb;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app.dart';
import 'bootstrap/firebase_bootstrap.dart';
import 'core/env/env.dart';
import 'core/router/app_router.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  env = Env.fromDefines();
  await FirebaseBootstrap.initialize();
  fb.FirebaseAuth.instance.authStateChanges().listen(_onAuthStateChanged);
  runApp(ProviderScope(child: ShortiGoApp(router: buildRouter())));
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
