import 'package:firebase_performance/firebase_performance.dart';

Future<T> withTrace<T>(String name, Future<T> Function() body) async {
  Trace? trace;
  try {
    trace = FirebasePerformance.instance.newTrace(name);
    await trace.start();
  } catch (_) {
    return body();
  }

  try {
    return await body();
  } finally {
    await trace.stop();
  }
}
