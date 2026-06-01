import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class AppBottomNav extends StatelessWidget {
  const AppBottomNav({super.key});

  static const _tabs = <_TabSpec>[
    _TabSpec(
      icon: Icons.home_outlined,
      selected: Icons.home,
      label: 'Discover',
      route: '/discover',
    ),
    _TabSpec(
      icon: Icons.play_circle_outline,
      selected: Icons.play_circle,
      label: 'Shorts',
      route: '/shorts',
    ),
    _TabSpec(
      icon: Icons.card_giftcard_outlined,
      selected: Icons.card_giftcard,
      label: 'Rewards',
      route: '/rewards',
    ),
    _TabSpec(
      icon: Icons.bookmark_outline,
      selected: Icons.bookmark,
      label: 'My List',
      route: '/my-list',
    ),
    _TabSpec(
      icon: Icons.person_outline,
      selected: Icons.person,
      label: 'Profile',
      route: '/profile',
    ),
  ];

  int _currentIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    for (var index = _tabs.length - 1; index >= 0; index--) {
      if (location.startsWith(_tabs[index].route)) {
        return index;
      }
    }
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final index = _currentIndex(context);
    return BottomNavigationBar(
      currentIndex: index,
      onTap: (index) => context.go(_tabs[index].route),
      items: [
        for (final tab in _tabs)
          BottomNavigationBarItem(
            icon: Icon(tab.icon),
            activeIcon: Icon(tab.selected),
            label: tab.label,
          ),
      ],
    );
  }
}

class _TabSpec {
  const _TabSpec({
    required this.icon,
    required this.selected,
    required this.label,
    required this.route,
  });

  final IconData icon;
  final IconData selected;
  final String label;
  final String route;
}
