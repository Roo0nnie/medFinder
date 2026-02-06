// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'navigation_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$currentTabIndexHash() => r'34f3ea7de9e179cc1645d860cb8c9457ff3bcb41';

/// Provider for the current navigation tab index.
///
/// Copied from [currentTabIndex].
@ProviderFor(currentTabIndex)
final currentTabIndexProvider = AutoDisposeProvider<int>.internal(
  currentTabIndex,
  name: r'currentTabIndexProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$currentTabIndexHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef CurrentTabIndexRef = AutoDisposeProviderRef<int>;
String _$navigationControllerHash() =>
    r'bdee14f8b4e23738ba2c267156c2d18423d9e0f3';

/// Provider for the PersistentTabController to manage bottom navigation state.
///
/// This allows other parts of the app to programmatically control navigation,
/// such as switching tabs or getting the current tab index.
///
/// Copied from [NavigationController].
@ProviderFor(NavigationController)
final navigationControllerProvider =
    AutoDisposeNotifierProvider<NavigationController, int>.internal(
      NavigationController.new,
      name: r'navigationControllerProvider',
      debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
          ? null
          : _$navigationControllerHash,
      dependencies: null,
      allTransitiveDependencies: null,
    );

typedef _$NavigationController = AutoDisposeNotifier<int>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
