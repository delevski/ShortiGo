import 'package:firebase_auth/firebase_auth.dart' as fb;
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:sentry_flutter/sentry_flutter.dart';

import '../../app.dart';
import '../../features/auth/presentation/login_page.dart';
import '../../features/splash/presentation/splash_page.dart';
import '../../features/discover/presentation/discover_page.dart';
import '../../features/episode_player/presentation/episode_player_page.dart';
import '../../features/my_list/presentation/my_list_page.dart';
import '../../features/onboarding/presentation/onboarding_page.dart';
import '../../features/profile/presentation/profile_page.dart';
import '../../features/rewards/presentation/rewards_page.dart';
import '../../features/series_detail/presentation/series_detail_page.dart';
import '../../features/shorts/presentation/shorts_page.dart';
import '../../features/subscription/presentation/subscribe_page.dart';

/// Set by [buildRouter]; used by splash to pick the post-animation route.
bool splashRequireAuth = false;
bool Function()? splashIsLoggedIn;

GoRouter buildRouter({
  bool requireAuth = false,
  bool Function()? isLoggedIn,
}) {
  splashRequireAuth = requireAuth;
  splashIsLoggedIn = isLoggedIn;
  return GoRouter(
    initialLocation: '/splash',
    observers: [_SentryRouteObserver()],
    redirect: (context, state) {
      if (!requireAuth) {
        return null;
      }

      final loggedIn =
          isLoggedIn?.call() ?? fb.FirebaseAuth.instance.currentUser != null;
      final goingToLogin = state.matchedLocation == '/login';
      final goingToOnboarding = state.matchedLocation == '/onboarding';
      final goingToSplash = state.matchedLocation == '/splash';
      if (goingToSplash) {
        return null;
      }
      if (!loggedIn && !goingToLogin && !goingToOnboarding) {
        return '/onboarding';
      }
      if (loggedIn && (goingToLogin || goingToOnboarding)) {
        return '/discover';
      }
      return null;
    },
    routes: [
      ShellRoute(
        builder: (context, state, child) => AppShell(child: child),
        routes: [
          GoRoute(
            path: '/discover',
            builder: (_, __) => const DiscoverPage(),
          ),
          GoRoute(
            path: '/shorts',
            builder: (_, __) => const ShortsPage(),
          ),
          GoRoute(
            path: '/rewards',
            builder: (_, __) => const RewardsPage(),
          ),
          GoRoute(
            path: '/my-list',
            builder: (_, __) => const MyListPage(),
          ),
          GoRoute(
            path: '/profile',
            builder: (_, __) => const ProfilePage(),
          ),
          GoRoute(
            path: '/series/:id',
            builder: (_, state) => SeriesDetailPage(
              seriesId: state.pathParameters['id']!,
            ),
          ),
          GoRoute(
            path: '/player/:seriesId/:episodeId',
            builder: (_, state) => EpisodePlayerPage(
              seriesId: state.pathParameters['seriesId']!,
              episodeId: state.pathParameters['episodeId']!,
            ),
          ),
        ],
      ),
      GoRoute(
        path: '/splash',
        builder: (_, __) => const SplashPage(),
      ),
      GoRoute(
        path: '/onboarding',
        builder: (_, __) => const OnboardingPage(),
      ),
      GoRoute(
        path: '/login',
        builder: (_, __) => const LoginPage(),
      ),
      GoRoute(
        path: '/subscribe',
        builder: (_, __) => const SubscribePage(),
      ),
    ],
  );
}

class _SentryRouteObserver extends NavigatorObserver {
  @override
  void didPush(Route<dynamic> route, Route<dynamic>? previousRoute) {
    final name = route.settings.name;
    if (name != null) {
      Sentry.addBreadcrumb(
        Breadcrumb(
          category: 'navigation',
          data: {'to': name},
        ),
      );
    }
  }
}
