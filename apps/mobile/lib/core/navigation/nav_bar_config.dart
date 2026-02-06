import 'package:flutter/material.dart';
import 'package:mobile/features/dashboard/presentation/screens/dashboard_screen.dart';
import 'package:mobile/features/settings/presentation/screens/settings_screen.dart';
import 'package:mobile/features/todos/presentation/screens/todos_screen.dart';

/// Configuration for a single navigation bar tab item.
class NavBarItemConfig {
  const NavBarItemConfig({
    required this.title,
    required this.icon,
    required this.activeIcon,
    required this.screen,
    this.initialRoute = '/',
  });

  final String title;
  final IconData icon;
  final IconData activeIcon;
  final Widget screen;
  final String initialRoute;
}

/// Central configuration for the app's bottom navigation bar.
class AppNavBarConfig {
  AppNavBarConfig._();

  /// List of all navigation items in order.
  static List<NavBarItemConfig> get items => [
        const NavBarItemConfig(
          title: 'Dashboard',
          icon: Icons.dashboard_outlined,
          activeIcon: Icons.dashboard,
          screen: DashboardScreen(),
          initialRoute: '/dashboard',
        ),
        const NavBarItemConfig(
          title: 'Todos',
          icon: Icons.checklist_outlined,
          activeIcon: Icons.checklist,
          screen: TodosScreen(),
          initialRoute: '/todos',
        ),
        const NavBarItemConfig(
          title: 'Settings',
          icon: Icons.settings_outlined,
          activeIcon: Icons.settings,
          screen: SettingsScreen(),
          initialRoute: '/settings',
        ),
      ];

  /// Get the index of a tab by its route path.
  static int getIndexForRoute(String path) {
    for (int i = 0; i < items.length; i++) {
      if (path.startsWith(items[i].initialRoute)) {
        return i;
      }
    }
    return 0;
  }

  /// Get the route path for a tab by its index.
  static String getRouteForIndex(int index) {
    if (index >= 0 && index < items.length) {
      return items[index].initialRoute;
    }
    return items[0].initialRoute;
  }
}
