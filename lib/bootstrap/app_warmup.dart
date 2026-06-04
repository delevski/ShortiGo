import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../features/discover/application/discover_notifier.dart';
import '../features/shorts/application/shorts_feed_notifier.dart';

/// Kicks off Discover and Shorts feed loads during the splash animation.
void startAppWarmup(WidgetRef ref) {
  unawaited(ref.read(discoverNotifierProvider.future));
  unawaited(ref.read(shortsFeedNotifierProvider.future));
}
