import 'package:firebase_auth/firebase_auth.dart' as fb;
import 'package:go_router/go_router.dart';

import '../../app.dart';
import '../../features/auth/presentation/login_page.dart';
import '../../features/discover/presentation/discover_page.dart';
import '../../features/episode_player/presentation/episode_player_page.dart';
import '../../features/profile/presentation/profile_page.dart';
import '../../features/rewards/presentation/rewards_page.dart';
import '../../features/series_detail/presentation/series_detail_page.dart';
import '../../features/shorts/presentation/shorts_page.dart';
import '../../features/subscription/presentation/subscribe_page.dart';
import '../../shared/widgets/placeholder_page.dart';

GoRouter buildRouter({bool requireAuth = false}) {
  return GoRouter(
    initialLocation: '/discover',
    redirect: (context, state) {
      if (!requireAuth) {
        return null;
      }

      final loggedIn = fb.FirebaseAuth.instance.currentUser != null;
      final goingToLogin = state.matchedLocation == '/login';
      if (!loggedIn && !goingToLogin) {
        return '/login';
      }
      if (loggedIn && goingToLogin) {
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
            builder: (_, __) => const PlaceholderPage(title: 'My List'),
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
