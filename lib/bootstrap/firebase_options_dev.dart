import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart'
    show TargetPlatform, defaultTargetPlatform, kIsWeb;

class DefaultFirebaseOptions {
  const DefaultFirebaseOptions._();

  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      throw UnsupportedError('Firebase web options are not configured.');
    }

    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      case TargetPlatform.macOS:
      case TargetPlatform.windows:
      case TargetPlatform.linux:
      case TargetPlatform.fuchsia:
        throw UnsupportedError(
          'Firebase is not configured for ${defaultTargetPlatform.name}.',
        );
    }
  }

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyDSMHqRfRAcQ9cyS9aylLMMbrnbDSspf6c',
    appId: '1:8786663267:android:e2229849606db566d2a556',
    messagingSenderId: '8786663267',
    projectId: 'shortigo-prod',
    storageBucket: 'shortigo-prod.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyAv5_HCTTEDtCL1VKd1fbwWBz6UVResNRA',
    appId: '1:8786663267:ios:172dbecd58be1d8cd2a556',
    messagingSenderId: '8786663267',
    projectId: 'shortigo-prod',
    storageBucket: 'shortigo-prod.firebasestorage.app',
    iosBundleId: 'com.shortigo.shortigo',
  );
}
