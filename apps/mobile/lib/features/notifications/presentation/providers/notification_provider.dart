import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/services/notifications/notification_service.dart';

/// Provider that tracks whether notification permissions are granted.
///
/// Returns a [Future<bool>] that resolves to `true` when the user has
/// granted notification permissions, and `false` otherwise. Invalidating
/// this provider re-checks the current permission state.
final notificationPermissionProvider = FutureProvider<bool>((ref) async {
  final service = ref.watch(notificationServiceProvider);
  return service.isPermissionGranted();
});

/// Provider that exposes the count of currently scheduled notifications.
///
/// Useful for displaying a badge or summary on the notification settings
/// screen. Invalidate to refresh after scheduling or cancelling.
final scheduledNotificationCountProvider = FutureProvider<int>((ref) async {
  final service = ref.watch(notificationServiceProvider);
  final scheduled = await service.getScheduledNotifications();
  return scheduled.length;
});

/// Provider that exposes the current app badge count.
final badgeCountProvider = FutureProvider<int>((ref) async {
  final service = ref.watch(notificationServiceProvider);
  return service.getBadgeCount();
});

/// Notifier for managing notification-related actions that mutate state.
///
/// Provides methods for requesting permissions, sending test notifications,
/// and clearing notifications, while automatically refreshing dependent
/// providers.
class NotificationActionsNotifier extends Notifier<void> {
  @override
  void build() {
    // No state to initialize.
  }

  /// Requests notification permission and refreshes the permission provider.
  Future<bool> requestPermission() async {
    final service = ref.read(notificationServiceProvider);
    final granted = await service.requestPermission();
    ref.invalidate(notificationPermissionProvider);
    return granted;
  }

  /// Sends a test notification using the general channel.
  Future<void> sendTestNotification({
    required String title,
    required String body,
    String channelKey = NotificationChannels.general,
    Map<String, String>? payload,
  }) async {
    final service = ref.read(notificationServiceProvider);
    await service.showNotification(
      NotificationConfig(
        title: title,
        body: body,
        channelKey: channelKey,
        payload: payload,
      ),
    );
  }

  /// Cancels all scheduled and displayed notifications, then refreshes state.
  Future<void> cancelAll() async {
    final service = ref.read(notificationServiceProvider);
    await service.cancelAllNotifications();
    ref.invalidate(scheduledNotificationCountProvider);
    ref.invalidate(badgeCountProvider);
  }

  /// Resets the app badge count to zero.
  Future<void> resetBadge() async {
    final service = ref.read(notificationServiceProvider);
    await service.resetBadgeCount();
    ref.invalidate(badgeCountProvider);
  }
}

/// Provider for the notification actions notifier.
final notificationActionsProvider =
    NotifierProvider<NotificationActionsNotifier, void>(
  NotificationActionsNotifier.new,
);
