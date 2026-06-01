import 'package:go_router/go_router.dart';

import '../../app.dart';
import '../../features/discover/presentation/discover_page.dart';
import '../../features/series_detail/presentation/series_detail_page.dart';
import '../../shared/widgets/placeholder_page.dart';

GoRouter buildRouter() {
  return GoRouter(
    initialLocation: '/discover',
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
            builder: (_, __) => const PlaceholderPage(title: 'Shorts'),
          ),
          GoRoute(
            path: '/rewards',
            builder: (_, __) => const PlaceholderPage(title: 'Rewards'),
          ),
          GoRoute(
            path: '/my-list',
            builder: (_, __) => const PlaceholderPage(title: 'My List'),
          ),
          GoRoute(
            path: '/profile',
            builder: (_, __) => const PlaceholderPage(title: 'Profile'),
          ),
          GoRoute(
            path: '/series/:id',
            builder: (_, state) => SeriesDetailPage(
              seriesId: state.pathParameters['id']!,
            ),
          ),
          GoRoute(
            path: '/player/:seriesId/:episodeId',
            builder: (_, state) => PlaceholderPage(
              title: 'Player ${state.pathParameters['episodeId']}',
            ),
          ),
        ],
      ),
      GoRoute(
        path: '/login',
        builder: (_, __) => const PlaceholderPage(title: 'Login'),
      ),
    ],
  );
}
