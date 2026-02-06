// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'theme_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$themeModeHash() => r'6571dfbff64abe33db03bbd0c932480da33bd481';

/// Provider for the current theme mode.
///
/// Copied from [themeMode].
@ProviderFor(themeMode)
final themeModeProvider = AutoDisposeProvider<ThemeMode>.internal(
  themeMode,
  name: r'themeModeProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$themeModeHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef ThemeModeRef = AutoDisposeProviderRef<ThemeMode>;
String _$appColorSchemeHash() => r'716c3d7b85f87bf830a072c0a6d7ad946c16fa2c';

/// Provider for the current color scheme.
///
/// Copied from [appColorScheme].
@ProviderFor(appColorScheme)
final appColorSchemeProvider = AutoDisposeProvider<AppColorScheme>.internal(
  appColorScheme,
  name: r'appColorSchemeProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$appColorSchemeHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef AppColorSchemeRef = AutoDisposeProviderRef<AppColorScheme>;
String _$lightThemeHash() => r'8e201569fa01678786775dee0dd8c6f491b451ac';

/// Provider for the light theme based on the current color scheme.
///
/// Copied from [lightTheme].
@ProviderFor(lightTheme)
final lightThemeProvider = AutoDisposeProvider<ThemeData>.internal(
  lightTheme,
  name: r'lightThemeProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$lightThemeHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef LightThemeRef = AutoDisposeProviderRef<ThemeData>;
String _$darkThemeHash() => r'38745035d555ae7192c5a129612f8d08a1ff2be3';

/// Provider for the dark theme based on the current color scheme.
///
/// Copied from [darkTheme].
@ProviderFor(darkTheme)
final darkThemeProvider = AutoDisposeProvider<ThemeData>.internal(
  darkTheme,
  name: r'darkThemeProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$darkThemeHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef DarkThemeRef = AutoDisposeProviderRef<ThemeData>;
String _$themeModeDisplayNameHash() =>
    r'976df7fbf8b6faa823555976419b3fd55189dd5d';

/// Provider that returns a display name for the current theme mode.
///
/// Copied from [themeModeDisplayName].
@ProviderFor(themeModeDisplayName)
final themeModeDisplayNameProvider = AutoDisposeProvider<String>.internal(
  themeModeDisplayName,
  name: r'themeModeDisplayNameProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$themeModeDisplayNameHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef ThemeModeDisplayNameRef = AutoDisposeProviderRef<String>;
String _$themeControllerHash() => r'ff0a04376147d806175952d2fb6da5c1e31ae90d';

/// Provider for the theme state with persistence.
///
/// Copied from [ThemeController].
@ProviderFor(ThemeController)
final themeControllerProvider =
    NotifierProvider<ThemeController, ThemeState>.internal(
      ThemeController.new,
      name: r'themeControllerProvider',
      debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
          ? null
          : _$themeControllerHash,
      dependencies: null,
      allTransitiveDependencies: null,
    );

typedef _$ThemeController = Notifier<ThemeState>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
