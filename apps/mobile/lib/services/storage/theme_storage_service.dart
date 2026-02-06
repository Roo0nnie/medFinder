import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/theme/flex_theme_config.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Provider for SharedPreferences instance.
/// Must be overridden in main.dart with the actual instance.
final sharedPreferencesProvider = Provider<SharedPreferences>((ref) {
  throw UnimplementedError(
    'sharedPreferencesProvider must be overridden with actual SharedPreferences instance',
  );
});

/// Provider for the theme storage service.
final themeStorageServiceProvider = Provider<ThemeStorageService>((ref) {
  final prefs = ref.watch(sharedPreferencesProvider);
  return ThemeStorageService(prefs);
});

/// Service for persisting theme preferences using SharedPreferences.
class ThemeStorageService {
  ThemeStorageService(this._prefs);

  final SharedPreferences _prefs;

  static const String _themeModeKey = 'theme_mode';
  static const String _colorSchemeKey = 'color_scheme';

  /// Gets the saved theme mode.
  /// Returns null if no preference is saved.
  ThemeMode? getThemeMode() {
    final value = _prefs.getString(_themeModeKey);
    if (value == null) return null;

    return switch (value) {
      'light' => ThemeMode.light,
      'dark' => ThemeMode.dark,
      'system' => ThemeMode.system,
      _ => null,
    };
  }

  /// Saves the theme mode preference.
  Future<void> setThemeMode(ThemeMode mode) async {
    final value = switch (mode) {
      ThemeMode.light => 'light',
      ThemeMode.dark => 'dark',
      ThemeMode.system => 'system',
    };
    await _prefs.setString(_themeModeKey, value);
  }

  /// Gets the saved color scheme.
  /// Returns null if no preference is saved.
  AppColorScheme? getColorScheme() {
    final value = _prefs.getString(_colorSchemeKey);
    if (value == null) return null;

    try {
      return AppColorScheme.values.firstWhere(
        (scheme) => scheme.name == value,
      );
    } catch (_) {
      return null;
    }
  }

  /// Saves the color scheme preference.
  Future<void> setColorScheme(AppColorScheme scheme) async {
    await _prefs.setString(_colorSchemeKey, scheme.name);
  }

  /// Clears all theme preferences.
  Future<void> clearPreferences() async {
    await Future.wait([
      _prefs.remove(_themeModeKey),
      _prefs.remove(_colorSchemeKey),
    ]);
  }
}
