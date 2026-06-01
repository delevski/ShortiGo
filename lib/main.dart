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
  runApp(ProviderScope(child: ShortiGoApp(router: buildRouter())));
}
