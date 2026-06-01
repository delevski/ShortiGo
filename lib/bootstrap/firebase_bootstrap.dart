import 'package:firebase_core/firebase_core.dart';
import '../core/env/env.dart';
import 'firebase_options_dev.dart' as dev;
import 'firebase_options_prod.dart' as prod;

class FirebaseBootstrap {
  const FirebaseBootstrap._();

  static Future<void> initialize() async {
    if (env.isProd) {
      await Firebase.initializeApp(options: prod.DefaultFirebaseOptions.currentPlatform);
    } else {
      await Firebase.initializeApp(options: dev.DefaultFirebaseOptions.currentPlatform);
    }
  }
}
