import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:persistent_bottom_nav_bar_v2/persistent_bottom_nav_bar_v2.dart';
import 'package:mobile/core/navigation/nav_bar_config.dart';
import 'package:mobile/core/navigation/navigation_provider.dart';

/// A persistent bottom navigation bar that maintains state across tab switches.
///
/// Uses persistent_bottom_nav_bar_v2 to provide:
/// - State preservation when switching between tabs
/// - Smooth animations
/// - Customizable styling that matches the app theme
/// - Integration with Riverpod for state management
class PersistentNavBar extends ConsumerWidget {
  const PersistentNavBar({
    super.key,
    this.initialIndex = 0,
  });

  /// The initial tab index to display.
  final int initialIndex;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = AppNavBarConfig.items;
    final colorScheme = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final navController = ref.read(navigationControllerProvider.notifier);

    return PersistentTabView(
      controller: navController.controller,
      tabs: items.map((item) {
        return PersistentTabConfig(
          screen: item.screen,
          item: ItemConfig(
            icon: Icon(item.icon),
            inactiveIcon: Icon(item.icon),
            title: item.title,
            activeForegroundColor: colorScheme.primary,
            inactiveForegroundColor: colorScheme.onSurface.withValues(alpha: 0.6),
          ),
        );
      }).toList(),
      navBarBuilder: (navBarConfig) => Style1BottomNavBar(
        navBarConfig: navBarConfig,
        navBarDecoration: NavBarDecoration(
          color: isDark ? colorScheme.surface : colorScheme.surface,
          boxShadow: [
            BoxShadow(
              color: colorScheme.shadow.withValues(alpha: 0.1),
              blurRadius: 8,
              offset: const Offset(0, -2),
            ),
          ],
          border: Border(
            top: BorderSide(
              color: colorScheme.outline.withValues(alpha: 0.2),
              width: 0.5,
            ),
          ),
        ),
      ),
      backgroundColor: colorScheme.surface,
      handleAndroidBackButtonPress: true,
      resizeToAvoidBottomInset: true,
      stateManagement: true,
      screenTransitionAnimation: const ScreenTransitionAnimation(
        curve: Curves.easeInOut,
        duration: Duration(milliseconds: 200),
      ),
      onTabChanged: (index) {
        navController.setIndex(index);
      },
    );
  }
}

/// A variant of PersistentNavBar using Style 3 (shifting style).
class PersistentNavBarStyle3 extends ConsumerWidget {
  const PersistentNavBarStyle3({
    super.key,
    this.initialIndex = 0,
  });

  final int initialIndex;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = AppNavBarConfig.items;
    final colorScheme = Theme.of(context).colorScheme;
    final navController = ref.read(navigationControllerProvider.notifier);

    return PersistentTabView(
      controller: navController.controller,
      tabs: items.map((item) {
        return PersistentTabConfig(
          screen: item.screen,
          item: ItemConfig(
            icon: Icon(item.icon),
            inactiveIcon: Icon(item.icon),
            title: item.title,
            activeForegroundColor: colorScheme.primary,
            inactiveForegroundColor: colorScheme.onSurface.withValues(alpha: 0.6),
          ),
        );
      }).toList(),
      navBarBuilder: (navBarConfig) => Style3BottomNavBar(
        navBarConfig: navBarConfig,
        navBarDecoration: NavBarDecoration(
          color: colorScheme.surface,
          boxShadow: [
            BoxShadow(
              color: colorScheme.shadow.withValues(alpha: 0.1),
              blurRadius: 8,
              offset: const Offset(0, -2),
            ),
          ],
        ),
      ),
      backgroundColor: colorScheme.surface,
      handleAndroidBackButtonPress: true,
      resizeToAvoidBottomInset: true,
      stateManagement: true,
      screenTransitionAnimation: const ScreenTransitionAnimation(
        curve: Curves.easeInOut,
        duration: Duration(milliseconds: 200),
      ),
      onTabChanged: (index) {
        navController.setIndex(index);
      },
    );
  }
}

/// A variant of PersistentNavBar using Style 6 (neumorphic style).
class PersistentNavBarNeumorphic extends ConsumerWidget {
  const PersistentNavBarNeumorphic({
    super.key,
    this.initialIndex = 0,
  });

  final int initialIndex;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = AppNavBarConfig.items;
    final colorScheme = Theme.of(context).colorScheme;
    final navController = ref.read(navigationControllerProvider.notifier);

    return PersistentTabView(
      controller: navController.controller,
      tabs: items.map((item) {
        return PersistentTabConfig(
          screen: item.screen,
          item: ItemConfig(
            icon: Icon(item.icon),
            inactiveIcon: Icon(item.icon),
            title: item.title,
            activeForegroundColor: colorScheme.primary,
            inactiveForegroundColor: colorScheme.onSurface.withValues(alpha: 0.6),
          ),
        );
      }).toList(),
      navBarBuilder: (navBarConfig) => Style6BottomNavBar(
        navBarConfig: navBarConfig,
        navBarDecoration: NavBarDecoration(
          color: colorScheme.surface,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: colorScheme.shadow.withValues(alpha: 0.15),
              blurRadius: 12,
              offset: const Offset(0, -4),
            ),
          ],
        ),
      ),
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      backgroundColor: Colors.transparent,
      handleAndroidBackButtonPress: true,
      resizeToAvoidBottomInset: true,
      stateManagement: true,
      screenTransitionAnimation: const ScreenTransitionAnimation(
        curve: Curves.easeInOut,
        duration: Duration(milliseconds: 200),
      ),
      onTabChanged: (index) {
        navController.setIndex(index);
      },
    );
  }
}

/// A variant of PersistentNavBar using Style 12 (modern with indicator).
class PersistentNavBarModern extends ConsumerWidget {
  const PersistentNavBarModern({
    super.key,
    this.initialIndex = 0,
  });

  final int initialIndex;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = AppNavBarConfig.items;
    final colorScheme = Theme.of(context).colorScheme;
    final navController = ref.read(navigationControllerProvider.notifier);

    return PersistentTabView(
      controller: navController.controller,
      tabs: items.map((item) {
        return PersistentTabConfig(
          screen: item.screen,
          item: ItemConfig(
            icon: Icon(item.icon),
            inactiveIcon: Icon(item.icon),
            title: item.title,
            activeForegroundColor: colorScheme.primary,
            inactiveForegroundColor: colorScheme.onSurface.withValues(alpha: 0.6),
          ),
        );
      }).toList(),
      navBarBuilder: (navBarConfig) => Style12BottomNavBar(
        navBarConfig: navBarConfig,
        navBarDecoration: NavBarDecoration(
          color: colorScheme.surface,
          boxShadow: [
            BoxShadow(
              color: colorScheme.shadow.withValues(alpha: 0.1),
              blurRadius: 8,
              offset: const Offset(0, -2),
            ),
          ],
          border: Border(
            top: BorderSide(
              color: colorScheme.outline.withValues(alpha: 0.2),
              width: 0.5,
            ),
          ),
        ),
      ),
      backgroundColor: colorScheme.surface,
      handleAndroidBackButtonPress: true,
      resizeToAvoidBottomInset: true,
      stateManagement: true,
      screenTransitionAnimation: const ScreenTransitionAnimation(
        curve: Curves.easeInOut,
        duration: Duration(milliseconds: 200),
      ),
      onTabChanged: (index) {
        navController.setIndex(index);
      },
    );
  }
}
