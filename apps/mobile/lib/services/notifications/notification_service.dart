import 'dart:async';

import 'package:awesome_notifications/awesome_notifications.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Provider for the notification service singleton.
final notificationServiceProvider = Provider<NotificationService>((ref) {
  return NotificationService();
});

/// Notification channel keys used throughout the app.
///
/// Each channel represents a distinct category of notification with its own
/// default sound, importance level, and grouping behavior.
abstract class NotificationChannels {
  static const String general = 'general_channel';
  static const String reminders = 'reminders_channel';
  static const String alerts = 'alerts_channel';
}

/// Configuration for creating a local notification.
///
/// Wraps the most common parameters needed when scheduling or immediately
/// displaying a notification. Keeps the public API simple while still
/// exposing enough control for typical use cases.
class NotificationConfig {
  const NotificationConfig({
    required this.title,
    required this.body,
    this.channelKey = NotificationChannels.general,
    this.id,
    this.summary,
    this.largeIcon,
    this.bigPicture,
    this.payload,
    this.actionButtons,
    this.notificationLayout = NotificationLayout.Default,
    this.category,
    this.wakeUpScreen = false,
    this.autoDismissible = true,
    this.locked = false,
  });

  /// Unique notification ID. If null, a random ID is generated.
  final int? id;

  /// The notification title displayed in bold.
  final String title;

  /// The notification body text.
  final String body;

  /// Optional summary text (shown in grouped notifications on Android).
  final String? summary;

  /// The channel key that determines sound, importance, and grouping.
  final String channelKey;

  /// Optional large icon URL or asset path.
  final String? largeIcon;

  /// Optional big picture URL or asset path for expanded view.
  final String? bigPicture;

  /// Custom payload data delivered to the action handler on tap.
  final Map<String, String>? payload;

  /// Optional action buttons displayed below the notification.
  final List<NotificationActionButton>? actionButtons;

  /// Layout style for the notification content.
  final NotificationLayout notificationLayout;

  /// Notification category for system-level behavior hints.
  final NotificationCategory? category;

  /// Whether to wake the screen when the notification fires.
  final bool wakeUpScreen;

  /// Whether the notification is automatically dismissed on tap.
  final bool autoDismissible;

  /// Whether the notification is locked (cannot be swiped away).
  final bool locked;
}

/// Configuration for scheduling a notification at a specific time.
class ScheduledNotificationConfig {
  const ScheduledNotificationConfig({
    required this.notificationConfig,
    required this.schedule,
    this.allowWhileIdle = true,
    this.repeats = false,
    this.preciseAlarm = true,
  });

  /// The notification content configuration.
  final NotificationConfig notificationConfig;

  /// The schedule timing (interval, calendar, or cron).
  final NotificationSchedule schedule;

  /// Whether to fire even when the device is in low-power idle mode.
  final bool allowWhileIdle;

  /// Whether the schedule repeats.
  final bool repeats;

  /// Whether to use exact alarm timing (Android 12+).
  final bool preciseAlarm;
}

/// Service for managing local push notifications via awesome_notifications.
///
/// This service handles initialization, permission requests, creating and
/// scheduling notifications, and processing notification action events.
///
/// Usage:
/// ```dart
/// // With Riverpod
/// final service = ref.read(notificationServiceProvider);
/// await service.showNotification(
///   const NotificationConfig(
///     title: 'Hello',
///     body: 'This is a notification',
///   ),
/// );
///
/// // Or via the global instance
/// await NotificationService.instance.showNotification(
///   const NotificationConfig(
///     title: 'Task Due',
///     body: 'Your task is due in 5 minutes',
///     channelKey: NotificationChannels.reminders,
///   ),
/// );
/// ```
class NotificationService {
  NotificationService._internal();

  static final NotificationService _instance = NotificationService._internal();

  /// Global singleton instance for use without Riverpod.
  static NotificationService get instance => _instance;

  /// Factory constructor returns the singleton instance.
  factory NotificationService() => _instance;

  /// Stream controller for notification action events.
  ///
  /// Widgets can listen to this stream to react when the user taps a
  /// notification or presses an action button.
  final StreamController<ReceivedAction> _actionStreamController =
      StreamController<ReceivedAction>.broadcast();

  /// Stream of notification action events (taps, button presses).
  Stream<ReceivedAction> get onActionReceived => _actionStreamController.stream;

  /// Whether the service has been initialized.
  bool _isInitialized = false;

  /// Initializes awesome_notifications with default channels.
  ///
  /// This must be called once before [runApp], typically in [main].
  /// Subsequent calls are ignored.
  Future<void> initialize() async {
    if (_isInitialized) return;

    await AwesomeNotifications().initialize(
      // null uses the default app icon on Android.
      // For a custom icon, use 'resource://drawable/ic_notification'.
      null,
      [
        NotificationChannel(
          channelKey: NotificationChannels.general,
          channelName: 'General Notifications',
          channelDescription: 'General app notifications',
          defaultColor: const Color(0xFF6750A4),
          ledColor: const Color(0xFF6750A4),
          importance: NotificationImportance.High,
          channelShowBadge: true,
        ),
        NotificationChannel(
          channelKey: NotificationChannels.reminders,
          channelName: 'Reminders',
          channelDescription: 'Scheduled reminder notifications',
          defaultColor: const Color(0xFF625B71),
          ledColor: const Color(0xFF625B71),
          importance: NotificationImportance.High,
          channelShowBadge: true,
          enableVibration: true,
        ),
        NotificationChannel(
          channelKey: NotificationChannels.alerts,
          channelName: 'Alerts',
          channelDescription: 'Important alerts that require attention',
          defaultColor: const Color(0xFFBA1A1A),
          ledColor: const Color(0xFFBA1A1A),
          importance: NotificationImportance.Max,
          channelShowBadge: true,
          enableVibration: true,
          playSound: true,
          criticalAlerts: true,
        ),
      ],
    );

    _isInitialized = true;
  }

  /// Sets up notification action listeners.
  ///
  /// Call this after [initialize] and after [runApp] so that action events
  /// can properly navigate or update UI. The [onActionReceived] callback is
  /// invoked on the main isolate when the user taps a notification or
  /// presses an action button.
  ///
  /// An optional [onAction] callback can be provided for direct handling.
  /// The event is also broadcast on the [onActionReceived] stream.
  Future<void> setListeners({
    void Function(ReceivedAction)? onAction,
  }) async {
    AwesomeNotifications().setListeners(
      onActionReceivedMethod: _onActionReceivedMethod,
      onNotificationCreatedMethod: _onNotificationCreatedMethod,
      onNotificationDisplayedMethod: _onNotificationDisplayedMethod,
      onDismissActionReceivedMethod: _onDismissActionReceivedMethod,
    );

    if (onAction != null) {
      _actionStreamController.stream.listen(onAction);
    }
  }

  /// Requests notification permissions from the user.
  ///
  /// Returns `true` if all requested permissions are granted.
  /// On Android 13+ this triggers the runtime permission dialog.
  /// On iOS this triggers the native notification permission alert.
  Future<bool> requestPermission() async {
    final isAllowed = await AwesomeNotifications().isNotificationAllowed();
    if (isAllowed) return true;

    return AwesomeNotifications().requestPermissionToSendNotifications();
  }

  /// Checks whether notification permissions are currently granted.
  Future<bool> isPermissionGranted() async {
    return AwesomeNotifications().isNotificationAllowed();
  }

  /// Displays a notification immediately.
  ///
  /// Returns the notification ID if created successfully, or `null` on failure.
  Future<bool> showNotification(NotificationConfig config) async {
    return AwesomeNotifications().createNotification(
      content: _buildContent(config),
      actionButtons: config.actionButtons,
    );
  }

  /// Schedules a notification to be displayed at a future time.
  ///
  /// Returns `true` if the notification was scheduled successfully.
  Future<bool> scheduleNotification(ScheduledNotificationConfig config) async {
    return AwesomeNotifications().createNotification(
      content: _buildContent(config.notificationConfig),
      schedule: config.schedule,
      actionButtons: config.notificationConfig.actionButtons,
    );
  }

  /// Cancels a specific notification by its ID.
  Future<void> cancelNotification(int id) async {
    await AwesomeNotifications().cancel(id);
  }

  /// Cancels all scheduled notifications.
  Future<void> cancelAllScheduledNotifications() async {
    await AwesomeNotifications().cancelAllSchedules();
  }

  /// Cancels all active and scheduled notifications.
  Future<void> cancelAllNotifications() async {
    await AwesomeNotifications().cancelAll();
  }

  /// Dismisses a specific notification from the status bar by its ID.
  Future<void> dismissNotification(int id) async {
    await AwesomeNotifications().dismiss(id);
  }

  /// Dismisses all notifications from the status bar.
  Future<void> dismissAllNotifications() async {
    await AwesomeNotifications().dismissAllNotifications();
  }

  /// Returns a list of all scheduled notification IDs.
  Future<List<NotificationModel>> getScheduledNotifications() async {
    return AwesomeNotifications().listScheduledNotifications();
  }

  /// Returns the current badge count.
  Future<int> getBadgeCount() async {
    return AwesomeNotifications().getGlobalBadgeCounter();
  }

  /// Sets the app badge count.
  Future<void> setBadgeCount(int count) async {
    await AwesomeNotifications().setGlobalBadgeCounter(count);
  }

  /// Resets the app badge count to zero.
  Future<void> resetBadgeCount() async {
    await AwesomeNotifications().resetGlobalBadge();
  }

  /// Disposes the action stream controller.
  ///
  /// Call this when the app is being disposed to prevent memory leaks.
  void dispose() {
    _actionStreamController.close();
  }

  /// Builds a [NotificationContent] from the simplified [NotificationConfig].
  NotificationContent _buildContent(NotificationConfig config) {
    return NotificationContent(
      id: config.id ?? UniqueKey().hashCode,
      channelKey: config.channelKey,
      title: config.title,
      body: config.body,
      summary: config.summary,
      largeIcon: config.largeIcon,
      bigPicture: config.bigPicture,
      payload: config.payload,
      notificationLayout: config.notificationLayout,
      category: config.category,
      wakeUpScreen: config.wakeUpScreen,
      autoDismissible: config.autoDismissible,
      locked: config.locked,
    );
  }

  // -- Static callback methods required by awesome_notifications --
  // These must be static or top-level functions because they may be
  // called from a background isolate on some platforms.

  @pragma('vm:entry-point')
  static Future<void> _onActionReceivedMethod(
    ReceivedAction receivedAction,
  ) async {
    _instance._actionStreamController.add(receivedAction);
  }

  @pragma('vm:entry-point')
  static Future<void> _onNotificationCreatedMethod(
    ReceivedNotification receivedNotification,
  ) async {
    // Optional: track notification creation for analytics.
  }

  @pragma('vm:entry-point')
  static Future<void> _onNotificationDisplayedMethod(
    ReceivedNotification receivedNotification,
  ) async {
    // Optional: track notification display for analytics.
  }

  @pragma('vm:entry-point')
  static Future<void> _onDismissActionReceivedMethod(
    ReceivedAction receivedAction,
  ) async {
    // Optional: handle notification dismissal.
  }
}
