import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:toastification/toastification.dart';

/// Provider for the toast service.
final toastServiceProvider = Provider<ToastService>((ref) {
  return ToastService();
});

/// The type of toast notification to display.
enum ToastType {
  success,
  error,
  warning,
  info,
}

/// Configuration options for toast notifications.
///
/// Toasts are lightweight, non-interactive overlay notifications.
/// They auto-dismiss quickly and are used for simple confirmations
/// like "Copied!", "Saved!", "Done!", etc.
class ToastConfig {
  const ToastConfig({
    this.duration = const Duration(seconds: 2),
    this.icon,
    this.showIcon = true,
    this.showProgressBar = false,
    this.style = ToastificationStyle.fillColored,
  });

  /// Duration before the toast auto-dismisses.
  final Duration duration;

  /// Custom icon widget. If null, a default icon is used based on type.
  final IconData? icon;

  /// Whether to show an icon alongside the message.
  final bool showIcon;

  /// Whether to show a progress bar indicating time until auto-dismiss.
  final bool showProgressBar;

  /// The visual style for the toast notification.
  final ToastificationStyle style;
}

/// Service for displaying lightweight toast notifications using the
/// toastification package.
///
/// Toasts are non-interactive overlay notifications that auto-dismiss quickly.
/// They are used for simple confirmations and status messages.
///
/// Toasts differ from snackbars in that they:
/// - Are lightweight and non-interactive (no action buttons)
/// - Auto-dismiss quickly (default 2 seconds)
/// - Appear at the top of the screen as overlays
/// - Are used for simple confirmations like "Copied!", "Saved!", etc.
/// - Use theme-based colors for consistent appearance
///
/// Usage:
/// ```dart
/// // With Riverpod
/// ref.read(toastServiceProvider).showSuccess(context, 'Saved!');
///
/// // Or via the global instance
/// ToastService.instance.showInfo(context, 'Copied to clipboard');
/// ```
class ToastService {
  ToastService._internal();

  static final ToastService _instance = ToastService._internal();

  /// Global singleton instance for use without Riverpod.
  static ToastService get instance => _instance;

  /// Factory constructor returns the singleton instance.
  factory ToastService() => _instance;

  /// Shows a success toast notification.
  ///
  /// [context] - The build context (required for theme access).
  /// [message] - A short confirmation message (e.g., "Saved!").
  /// [config] - Optional configuration for customizing the toast.
  void showSuccess(
    BuildContext context,
    String message, {
    ToastConfig config = const ToastConfig(),
  }) {
    _show(
      context: context,
      type: ToastType.success,
      message: message,
      config: config,
    );
  }

  /// Shows an error toast notification.
  ///
  /// [context] - The build context (required for theme access).
  /// [message] - A short error message (e.g., "Failed to save").
  /// [config] - Optional configuration for customizing the toast.
  void showError(
    BuildContext context,
    String message, {
    ToastConfig config = const ToastConfig(),
  }) {
    _show(
      context: context,
      type: ToastType.error,
      message: message,
      config: config,
    );
  }

  /// Shows a warning toast notification.
  ///
  /// [context] - The build context (required for theme access).
  /// [message] - A short warning message (e.g., "Low battery").
  /// [config] - Optional configuration for customizing the toast.
  void showWarning(
    BuildContext context,
    String message, {
    ToastConfig config = const ToastConfig(),
  }) {
    _show(
      context: context,
      type: ToastType.warning,
      message: message,
      config: config,
    );
  }

  /// Shows an info toast notification.
  ///
  /// [context] - The build context (required for theme access).
  /// [message] - A short informational message (e.g., "Copied to clipboard").
  /// [config] - Optional configuration for customizing the toast.
  void showInfo(
    BuildContext context,
    String message, {
    ToastConfig config = const ToastConfig(),
  }) {
    _show(
      context: context,
      type: ToastType.info,
      message: message,
      config: config,
    );
  }

  /// Dismisses all currently visible toasts.
  void dismissAll() {
    toastification.dismissAll();
  }

  /// Internal method to show a toast using the toastification package.
  void _show({
    required BuildContext context,
    required ToastType type,
    required String message,
    required ToastConfig config,
  }) {
    final colorScheme = Theme.of(context).colorScheme;
    final primaryColor = _primaryColor(type, colorScheme);
    final backgroundColor = _backgroundColor(type, colorScheme);
    final foregroundColor = _foregroundColor(type, colorScheme);

    toastification.show(
      context: context,
      type: _toastificationType(type),
      style: config.style,
      title: Text(
        message,
        style: TextStyle(
          color: foregroundColor,
          fontWeight: FontWeight.w500,
        ),
      ),
      alignment: Alignment.topCenter,
      autoCloseDuration: config.duration,
      primaryColor: primaryColor,
      backgroundColor: backgroundColor,
      foregroundColor: foregroundColor,
      icon: config.showIcon
          ? Icon(
              config.icon ?? _defaultIcon(type),
              color: foregroundColor,
            )
          : null,
      showIcon: config.showIcon,
      showProgressBar: config.showProgressBar,
      dragToClose: true,
      pauseOnHover: true,
    );
  }

  /// Maps the custom ToastType to the toastification package type.
  ToastificationType _toastificationType(ToastType type) {
    return switch (type) {
      ToastType.success => ToastificationType.success,
      ToastType.error => ToastificationType.error,
      ToastType.warning => ToastificationType.warning,
      ToastType.info => ToastificationType.info,
    };
  }

  /// Returns the default icon for a toast type.
  IconData _defaultIcon(ToastType type) {
    return switch (type) {
      ToastType.success => Icons.check_circle_rounded,
      ToastType.error => Icons.error_rounded,
      ToastType.warning => Icons.warning_rounded,
      ToastType.info => Icons.info_rounded,
    };
  }

  /// Gets the primary/accent color from the theme's color scheme.
  Color _primaryColor(ToastType type, ColorScheme colorScheme) {
    return switch (type) {
      ToastType.success => colorScheme.primary,
      ToastType.error => colorScheme.error,
      ToastType.warning => colorScheme.tertiary,
      ToastType.info => colorScheme.secondary,
    };
  }

  /// Gets the background color from the theme's color scheme.
  /// Uses the solid primary/error/tertiary/secondary colors for strong contrast.
  Color _backgroundColor(ToastType type, ColorScheme colorScheme) {
    return switch (type) {
      ToastType.success => colorScheme.primary,
      ToastType.error => colorScheme.error,
      ToastType.warning => colorScheme.tertiary,
      ToastType.info => colorScheme.secondary,
    };
  }

  /// Gets the foreground/text color from the theme's color scheme.
  /// Uses the "on" variants designed for readability on the corresponding color.
  Color _foregroundColor(ToastType type, ColorScheme colorScheme) {
    return switch (type) {
      ToastType.success => colorScheme.onPrimary,
      ToastType.error => colorScheme.onError,
      ToastType.warning => colorScheme.onTertiary,
      ToastType.info => colorScheme.onSecondary,
    };
  }
}

/// Extension on BuildContext for convenient toast access.
extension ToastContextExtension on BuildContext {
  /// Shows a success toast notification.
  void showSuccessToast(
    String message, {
    ToastConfig config = const ToastConfig(),
  }) {
    ToastService.instance.showSuccess(this, message, config: config);
  }

  /// Shows an error toast notification.
  void showErrorToast(
    String message, {
    ToastConfig config = const ToastConfig(),
  }) {
    ToastService.instance.showError(this, message, config: config);
  }

  /// Shows a warning toast notification.
  void showWarningToast(
    String message, {
    ToastConfig config = const ToastConfig(),
  }) {
    ToastService.instance.showWarning(this, message, config: config);
  }

  /// Shows an info toast notification.
  void showInfoToast(
    String message, {
    ToastConfig config = const ToastConfig(),
  }) {
    ToastService.instance.showInfo(this, message, config: config);
  }

  /// Dismisses all current toasts.
  void dismissAllToasts() {
    ToastService.instance.dismissAll();
  }
}
