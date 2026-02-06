import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:persistent_bottom_nav_bar_v2/persistent_bottom_nav_bar_v2.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'navigation_provider.g.dart';

/// Provider for the PersistentTabController to manage bottom navigation state.
///
/// This allows other parts of the app to programmatically control navigation,
/// such as switching tabs or getting the current tab index.
@riverpod
class NavigationController extends _$NavigationController {
  PersistentTabController? _controller;

  @override
  int build() => 0;

  /// Get the PersistentTabController instance.
  PersistentTabController get controller {
    _controller ??= PersistentTabController(initialIndex: state);
    return _controller!;
  }

  /// Change the current tab index.
  void setIndex(int index) {
    state = index;
    _controller?.jumpToTab(index);
  }

  /// Navigate to the dashboard tab.
  void goToDashboard() => setIndex(0);

  /// Navigate to the todos tab.
  void goToTodos() => setIndex(1);

  /// Navigate to the settings tab.
  void goToSettings() => setIndex(2);

  /// Get the current tab index.
  int get currentIndex => state;
}

/// Provider for the current navigation tab index.
@riverpod
int currentTabIndex(Ref ref) {
  return ref.watch(navigationControllerProvider);
}
