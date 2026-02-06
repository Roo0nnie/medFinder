import 'package:awesome_snackbar_content/awesome_snackbar_content.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Provider for the snackbar service.
final snackbarServiceProvider = Provider<SnackbarService>((ref) {
  return SnackbarService();
});

/// Configuration options for snackbar notifications.
class SnackbarConfig {
  const SnackbarConfig({
    this.duration = const Duration(seconds: 4),
    this.action,
    this.onActionPressed,
    this.inMaterialBanner = false,
    this.dismissDirection = DismissDirection.horizontal,
    this.showCloseIcon = false,
  });

  /// Duration before the snackbar auto-dismisses.
  final Duration duration;

  /// Optional action button text (e.g., "Undo", "Retry", "View").
  final String? action;

  /// Callback when the action button is pressed.
  final VoidCallback? onActionPressed;

  /// Whether to display as a MaterialBanner instead of a SnackBar.
  /// MaterialBanners appear at the top of the screen and persist until dismissed.
  final bool inMaterialBanner;

  /// Direction in which the snackbar can be dismissed by swiping.
  final DismissDirection dismissDirection;

  /// Whether to show a close icon button on the snackbar.
  final bool showCloseIcon;

  /// Creates a copy of this config with the given fields replaced.
  SnackbarConfig copyWith({
    Duration? duration,
    String? action,
    VoidCallback? onActionPressed,
    bool? inMaterialBanner,
    DismissDirection? dismissDirection,
    bool? showCloseIcon,
  }) {
    return SnackbarConfig(
      duration: duration ?? this.duration,
      action: action ?? this.action,
      onActionPressed: onActionPressed ?? this.onActionPressed,
      inMaterialBanner: inMaterialBanner ?? this.inMaterialBanner,
      dismissDirection: dismissDirection ?? this.dismissDirection,
      showCloseIcon: showCloseIcon ?? this.showCloseIcon,
    );
  }
}

/// Service for displaying snackbar notifications throughout the app.
///
/// This service provides a simple API for showing various types of snackbars
/// (success, error, warning, help) using awesome_snackbar_content package.
///
/// Snackbars differ from toasts in that they:
/// - Appear at the bottom of the screen
/// - Often include action buttons (Undo, Retry, etc.)
/// - Are designed for user interaction
/// - Follow Material Design guidelines
///
/// Usage:
/// ```dart
/// // With Riverpod
/// ref.read(snackbarServiceProvider).showSuccess(
///   context,
///   title: 'Deleted',
///   message: 'Item has been removed',
///   config: SnackbarConfig(
///     action: 'Undo',
///     onActionPressed: () => restoreItem(),
///   ),
/// );
///
/// // Or via the global instance
/// SnackbarService.instance.showError(
///   context,
///   title: 'Error',
///   message: 'Something went wrong',
/// );
/// ```
class SnackbarService {
  SnackbarService._internal();

  static final SnackbarService _instance = SnackbarService._internal();

  /// Global singleton instance for use without Riverpod.
  static SnackbarService get instance => _instance;

  /// Factory constructor returns the singleton instance.
  factory SnackbarService() => _instance;

  /// Shows a success snackbar notification.
  ///
  /// [context] - The build context (required for ScaffoldMessenger).
  /// [title] - The title text to display.
  /// [message] - The main message to display.
  /// [config] - Optional configuration for customizing the snackbar.
  void showSuccess(
    BuildContext context, {
    required String title,
    required String message,
    SnackbarConfig config = const SnackbarConfig(),
  }) {
    _show(
      context: context,
      contentType: ContentType.success,
      title: title,
      message: message,
      config: config,
    );
  }

  /// Shows an error/failure snackbar notification.
  ///
  /// [context] - The build context (required for ScaffoldMessenger).
  /// [title] - The title text to display.
  /// [message] - The main message to display.
  /// [config] - Optional configuration for customizing the snackbar.
  void showError(
    BuildContext context, {
    required String title,
    required String message,
    SnackbarConfig config = const SnackbarConfig(),
  }) {
    _show(
      context: context,
      contentType: ContentType.failure,
      title: title,
      message: message,
      config: config,
    );
  }

  /// Shows a warning snackbar notification.
  ///
  /// [context] - The build context (required for ScaffoldMessenger).
  /// [title] - The title text to display.
  /// [message] - The main message to display.
  /// [config] - Optional configuration for customizing the snackbar.
  void showWarning(
    BuildContext context, {
    required String title,
    required String message,
    SnackbarConfig config = const SnackbarConfig(),
  }) {
    _show(
      context: context,
      contentType: ContentType.warning,
      title: title,
      message: message,
      config: config,
    );
  }

  /// Shows a help/info snackbar notification.
  ///
  /// [context] - The build context (required for ScaffoldMessenger).
  /// [title] - The title text to display.
  /// [message] - The main message to display.
  /// [config] - Optional configuration for customizing the snackbar.
  void showHelp(
    BuildContext context, {
    required String title,
    required String message,
    SnackbarConfig config = const SnackbarConfig(),
  }) {
    _show(
      context: context,
      contentType: ContentType.help,
      title: title,
      message: message,
      config: config,
    );
  }

  /// Hides the current snackbar.
  ///
  /// [context] - The build context (required for ScaffoldMessenger).
  void hide(BuildContext context) {
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
  }

  /// Hides any current material banner.
  ///
  /// [context] - The build context (required for ScaffoldMessenger).
  void hideBanner(BuildContext context) {
    ScaffoldMessenger.of(context).hideCurrentMaterialBanner();
  }

  /// Clears all snackbars from the queue.
  ///
  /// [context] - The build context (required for ScaffoldMessenger).
  void clearAll(BuildContext context) {
    ScaffoldMessenger.of(context).clearSnackBars();
  }

  /// Internal method to show snackbars with full configuration.
  void _show({
    required BuildContext context,
    required ContentType contentType,
    required String title,
    required String message,
    required SnackbarConfig config,
  }) {
    final scaffoldMessenger = ScaffoldMessenger.of(context);
    final colorScheme = Theme.of(context).colorScheme;

    // Create the awesome snackbar content
    final awesomeContent = AwesomeSnackbarContent(
      title: title,
      message: message,
      contentType: contentType,
      inMaterialBanner: config.inMaterialBanner,
    );

    if (config.inMaterialBanner) {
      // Hide any existing banner first
      scaffoldMessenger.hideCurrentMaterialBanner();

      // Show as MaterialBanner (appears at top)
      scaffoldMessenger.showMaterialBanner(
        MaterialBanner(
          elevation: 0,
          backgroundColor: Colors.transparent,
          forceActionsBelow: true,
          content: awesomeContent,
          actions: [
            if (config.action != null)
              TextButton(
                onPressed: () {
                  scaffoldMessenger.hideCurrentMaterialBanner();
                  config.onActionPressed?.call();
                },
                child: Text(
                  config.action!,
                  style: TextStyle(color: colorScheme.primary),
                ),
              )
            else
              TextButton(
                onPressed: () => scaffoldMessenger.hideCurrentMaterialBanner(),
                child: Text(
                  'Dismiss',
                  style: TextStyle(color: colorScheme.onSurface),
                ),
              ),
          ],
        ),
      );
    } else {
      // Hide any existing snackbar first
      scaffoldMessenger.hideCurrentSnackBar();

      // Build the content with the action button overlaid inside the
      // AwesomeSnackbarContent container. We use a Stack so the button
      // sits visually inside the colored snackbar body (bottom-right).
      Widget content;
      if (config.action != null) {
        content = Stack(
          clipBehavior: Clip.none,
          children: [
            awesomeContent,
            Positioned(
              bottom: 10,
              right: 12,
              child: TextButton(
                onPressed: () {
                  scaffoldMessenger.hideCurrentSnackBar();
                  config.onActionPressed?.call();
                },
                style: TextButton.styleFrom(
                  foregroundColor: Colors.white,
                  backgroundColor: Colors.white.withValues(alpha: 0.2),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                    side: BorderSide(
                      color: Colors.white.withValues(alpha: 0.4),
                    ),
                  ),
                ),
                child: Text(
                  config.action!,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                  ),
                ),
              ),
            ),
          ],
        );
      } else {
        content = awesomeContent;
      }

      // Show as SnackBar (appears at bottom)
      scaffoldMessenger.showSnackBar(
        SnackBar(
          elevation: 0,
          behavior: SnackBarBehavior.floating,
          backgroundColor: Colors.transparent,
          duration: config.duration,
          dismissDirection: config.dismissDirection,
          showCloseIcon: config.showCloseIcon,
          content: content,
        ),
      );
    }
  }

  /// Gets the action button color based on content type, using theme colors.
  Color _getActionColor(ContentType contentType, ColorScheme colorScheme) {
    return switch (contentType) {
      ContentType.success => colorScheme.primary,
      ContentType.failure => colorScheme.error,
      ContentType.warning => colorScheme.tertiary,
      ContentType.help => colorScheme.secondary,
      _ => colorScheme.onSurface,
    };
  }
}

/// Extension on BuildContext for convenient snackbar access.
extension SnackbarContextExtension on BuildContext {
  /// Shows a success snackbar notification.
  void showSuccessSnackbar({
    required String title,
    required String message,
    SnackbarConfig config = const SnackbarConfig(),
  }) {
    SnackbarService.instance.showSuccess(
      this,
      title: title,
      message: message,
      config: config,
    );
  }

  /// Shows an error/failure snackbar notification.
  void showErrorSnackbar({
    required String title,
    required String message,
    SnackbarConfig config = const SnackbarConfig(),
  }) {
    SnackbarService.instance.showError(
      this,
      title: title,
      message: message,
      config: config,
    );
  }

  /// Shows a warning snackbar notification.
  void showWarningSnackbar({
    required String title,
    required String message,
    SnackbarConfig config = const SnackbarConfig(),
  }) {
    SnackbarService.instance.showWarning(
      this,
      title: title,
      message: message,
      config: config,
    );
  }

  /// Shows a help/info snackbar notification.
  void showHelpSnackbar({
    required String title,
    required String message,
    SnackbarConfig config = const SnackbarConfig(),
  }) {
    SnackbarService.instance.showHelp(
      this,
      title: title,
      message: message,
      config: config,
    );
  }

  /// Hides the current snackbar.
  void hideSnackbar() {
    SnackbarService.instance.hide(this);
  }

  /// Hides the current material banner.
  void hideSnackbarBanner() {
    SnackbarService.instance.hideBanner(this);
  }

  /// Clears all snackbars from the queue.
  void clearAllSnackbars() {
    SnackbarService.instance.clearAll(this);
  }
}
