import 'package:go_router/go_router.dart';

import '../../app.dart';
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
            builder: (_, __) => const PlaceholderPage(title: 'Discover'),
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
        ],
      ),
      GoRoute(
        path: '/login',
        builder: (_, __) => const PlaceholderPage(title: 'Login'),
      ),
    ],
  );
}
