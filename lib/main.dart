import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app.dart';
import 'core/env/env.dart';
import 'core/router/app_router.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  env = Env.fromDefines();
  runApp(
    ProviderScope(
      child: ShortiGoApp(router: buildRouter()),
    ),
  );
}
