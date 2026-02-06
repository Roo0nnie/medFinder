import 'package:flex_color_scheme/flex_color_scheme.dart';
import 'package:flutter/material.dart';

/// Available color schemes for the app.
/// Each scheme provides a cohesive light and dark theme.
enum AppColorScheme {
  indigo('Indigo', FlexScheme.indigo),
  blue('Blue', FlexScheme.blue),
  deepBlue('Deep Blue', FlexScheme.deepBlue),
  hippieBlue('Hippie Blue', FlexScheme.hippieBlue),
  aquaBlue('Aqua Blue', FlexScheme.aquaBlue),
  brandBlue('Brand Blue', FlexScheme.brandBlue),
  green('Green', FlexScheme.green),
  jungle('Jungle', FlexScheme.jungle),
  red('Red', FlexScheme.red),
  redWine('Red Wine', FlexScheme.redWine),
  purpleBrown('Purple Brown', FlexScheme.purpleBrown),
  purple('Purple', FlexScheme.deepPurple),
  sakura('Sakura', FlexScheme.sakura),
  mandyRed('Mandy Red', FlexScheme.mandyRed),
  amber('Amber', FlexScheme.amber),
  gold('Gold', FlexScheme.gold),
  mango('Mango', FlexScheme.mango),
  espresso('Espresso', FlexScheme.espresso),
  barossa('Barossa', FlexScheme.barossa),
  shark('Shark', FlexScheme.shark),
  bigStone('Big Stone', FlexScheme.bigStone),
  damask('Damask', FlexScheme.damask),
  bahamaBlue('Bahama Blue', FlexScheme.bahamaBlue),
  mallardGreen('Mallard Green', FlexScheme.mallardGreen),
  materialDefault('Material', FlexScheme.material),
  materialHc('Material High Contrast', FlexScheme.materialHc),
  flutterDash('Flutter Dash', FlexScheme.flutterDash);

  const AppColorScheme(this.displayName, this.flexScheme);

  final String displayName;
  final FlexScheme flexScheme;

  /// Gets the primary color for this scheme to display in the picker.
  Color get previewColor {
    return FlexColorScheme.light(scheme: flexScheme).toScheme.primary;
  }
}

/// Theme configuration using FlexColorScheme.
/// Provides consistent, beautiful themes with extensive customization.
class FlexThemeConfig {
  FlexThemeConfig._();

  /// Default color scheme for new users.
  static const AppColorScheme defaultColorScheme = AppColorScheme.indigo;

  /// Default theme mode for new users.
  static const ThemeMode defaultThemeMode = ThemeMode.system;

  /// Creates a light theme for the given color scheme.
  static ThemeData light(AppColorScheme colorScheme) {
    return FlexThemeData.light(
      scheme: colorScheme.flexScheme,
      // Surface mode settings for elegant surface colors
      surfaceMode: FlexSurfaceMode.levelSurfacesLowScaffold,
      blendLevel: 7,
      // Sub-theme customization
      subThemesData: const FlexSubThemesData(
        // Overall blend level
        blendOnLevel: 10,
        blendOnColors: false,
        // Use Material 3 design
        useMaterial3Typography: true,
        useM2StyleDividerInM3: true,
        // AppBar settings
        appBarScrolledUnderElevation: 3.0,
        appBarCenterTitle: true,
        // TextField customization
        inputDecoratorIsFilled: true,
        inputDecoratorBorderType: FlexInputBorderType.outline,
        inputDecoratorRadius: 12.0,
        inputDecoratorUnfocusedHasBorder: true,
        inputDecoratorFocusedHasBorder: true,
        inputDecoratorPrefixIconSchemeColor: SchemeColor.primary,
        // Button settings
        filledButtonRadius: 12.0,
        elevatedButtonRadius: 12.0,
        outlinedButtonRadius: 12.0,
        textButtonRadius: 12.0,
        // FAB settings
        fabUseShape: true,
        fabAlwaysCircular: false,
        fabRadius: 16.0,
        // Card settings
        cardRadius: 12.0,
        // Dialog settings
        dialogRadius: 20.0,
        dialogElevation: 6.0,
        // Bottom sheet settings
        bottomSheetRadius: 20.0,
        bottomSheetElevation: 8.0,
        // Bottom navigation bar
        bottomNavigationBarSelectedLabelSchemeColor: SchemeColor.primary,
        bottomNavigationBarUnselectedLabelSchemeColor: SchemeColor.onSurface,
        bottomNavigationBarSelectedIconSchemeColor: SchemeColor.primary,
        bottomNavigationBarUnselectedIconSchemeColor: SchemeColor.onSurface,
        bottomNavigationBarBackgroundSchemeColor: SchemeColor.surface,
        bottomNavigationBarElevation: 3.0,
        // Navigation bar (Material 3)
        navigationBarSelectedLabelSchemeColor: SchemeColor.onSurface,
        navigationBarUnselectedLabelSchemeColor: SchemeColor.onSurface,
        navigationBarSelectedIconSchemeColor: SchemeColor.onSecondaryContainer,
        navigationBarUnselectedIconSchemeColor: SchemeColor.onSurface,
        navigationBarIndicatorSchemeColor: SchemeColor.secondaryContainer,
        navigationBarIndicatorOpacity: 1.0,
        navigationBarElevation: 3.0,
        // Chip settings
        chipRadius: 8.0,
        // Snackbar settings
        snackBarRadius: 8.0,
        snackBarElevation: 6.0,
        snackBarBackgroundSchemeColor: SchemeColor.inverseSurface,
        // Tab bar settings
        tabBarItemSchemeColor: SchemeColor.primary,
        tabBarIndicatorSchemeColor: SchemeColor.primary,
        // Switch, checkbox, and radio settings
        switchSchemeColor: SchemeColor.primary,
        checkboxSchemeColor: SchemeColor.primary,
        radioSchemeColor: SchemeColor.primary,
        // Slider settings
        sliderValueTinted: true,
      ),
      // Visual density
      visualDensity: FlexColorScheme.comfortablePlatformDensity,
      // Use Material 3
      useMaterial3: true,
      // Typography
      typography: Typography.material2021(),
    );
  }

  /// Creates a dark theme for the given color scheme.
  static ThemeData dark(AppColorScheme colorScheme) {
    return FlexThemeData.dark(
      scheme: colorScheme.flexScheme,
      // Surface mode settings for elegant surface colors
      surfaceMode: FlexSurfaceMode.levelSurfacesLowScaffold,
      blendLevel: 13,
      // Sub-theme customization
      subThemesData: const FlexSubThemesData(
        // Overall blend level
        blendOnLevel: 20,
        // Use Material 3 design
        useMaterial3Typography: true,
        useM2StyleDividerInM3: true,
        // AppBar settings
        appBarScrolledUnderElevation: 3.0,
        appBarCenterTitle: true,
        // TextField customization
        inputDecoratorIsFilled: true,
        inputDecoratorBorderType: FlexInputBorderType.outline,
        inputDecoratorRadius: 12.0,
        inputDecoratorUnfocusedHasBorder: true,
        inputDecoratorFocusedHasBorder: true,
        inputDecoratorPrefixIconSchemeColor: SchemeColor.primary,
        // Button settings
        filledButtonRadius: 12.0,
        elevatedButtonRadius: 12.0,
        outlinedButtonRadius: 12.0,
        textButtonRadius: 12.0,
        // FAB settings
        fabUseShape: true,
        fabAlwaysCircular: false,
        fabRadius: 16.0,
        // Card settings
        cardRadius: 12.0,
        // Dialog settings
        dialogRadius: 20.0,
        dialogElevation: 6.0,
        // Bottom sheet settings
        bottomSheetRadius: 20.0,
        bottomSheetElevation: 8.0,
        // Bottom navigation bar
        bottomNavigationBarSelectedLabelSchemeColor: SchemeColor.primary,
        bottomNavigationBarUnselectedLabelSchemeColor: SchemeColor.onSurface,
        bottomNavigationBarSelectedIconSchemeColor: SchemeColor.primary,
        bottomNavigationBarUnselectedIconSchemeColor: SchemeColor.onSurface,
        bottomNavigationBarBackgroundSchemeColor: SchemeColor.surface,
        bottomNavigationBarElevation: 3.0,
        // Navigation bar (Material 3)
        navigationBarSelectedLabelSchemeColor: SchemeColor.onSurface,
        navigationBarUnselectedLabelSchemeColor: SchemeColor.onSurface,
        navigationBarSelectedIconSchemeColor: SchemeColor.onSecondaryContainer,
        navigationBarUnselectedIconSchemeColor: SchemeColor.onSurface,
        navigationBarIndicatorSchemeColor: SchemeColor.secondaryContainer,
        navigationBarIndicatorOpacity: 1.0,
        navigationBarElevation: 3.0,
        // Chip settings
        chipRadius: 8.0,
        // Snackbar settings
        snackBarRadius: 8.0,
        snackBarElevation: 6.0,
        snackBarBackgroundSchemeColor: SchemeColor.inverseSurface,
        // Tab bar settings
        tabBarItemSchemeColor: SchemeColor.primary,
        tabBarIndicatorSchemeColor: SchemeColor.primary,
        // Switch, checkbox, and radio settings
        switchSchemeColor: SchemeColor.primary,
        checkboxSchemeColor: SchemeColor.primary,
        radioSchemeColor: SchemeColor.primary,
        // Slider settings
        sliderValueTinted: true,
      ),
      // Visual density
      visualDensity: FlexColorScheme.comfortablePlatformDensity,
      // Use Material 3
      useMaterial3: true,
      // Typography
      typography: Typography.material2021(),
    );
  }
}
