import 'package:firebase_core/firebase_core.dart';

class DefaultFirebaseOptions {
  const DefaultFirebaseOptions._();

  static const FirebaseOptions currentPlatform = FirebaseOptions(
    apiKey: 'prod-api-key',
    appId: '1:000000000001:android:0000000000000000000001',
    messagingSenderId: '000000000001',
    projectId: 'shortigo',
    storageBucket: 'shortigo.appspot.com',
  );
}
