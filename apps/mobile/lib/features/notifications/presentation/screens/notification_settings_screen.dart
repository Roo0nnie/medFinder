import 'package:awesome_notifications/awesome_notifications.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/extensions/context_extensions.dart';
import 'package:mobile/features/notifications/presentation/providers/notification_provider.dart';
import 'package:mobile/services/notifications/notification_service.dart';
import 'package:mobile/services/toast/toast_service.dart';

/// Screen for managing notification preferences and testing notifications.
///
/// Displays the current permission state, provides buttons to request
/// permissions, send test notifications across each channel, and clear
/// all pending notifications.
class NotificationSettingsScreen extends ConsumerWidget {
  const NotificationSettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final permissionAsync = ref.watch(notificationPermissionProvider);
    final scheduledCountAsync = ref.watch(scheduledNotificationCountProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Permission Status Section
            Text(
              'Permission',
              style: context.textTheme.titleSmall?.copyWith(
                color: context.colorScheme.primary,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: permissionAsync.when(
                  data: (isGranted) => _PermissionStatus(
                    isGranted: isGranted,
                    onRequest: () async {
                      final granted = await ref
                          .read(notificationActionsProvider.notifier)
                          .requestPermission();
                      if (context.mounted) {
                        if (granted) {
                          context.showSuccessToast(
                              'Notification permission granted');
                        } else {
                          context.showWarningToast(
                              'Permission denied. Enable in system settings.');
                        }
                      }
                    },
                  ),
                  loading: () => const Center(
                    child: Padding(
                      padding: EdgeInsets.all(8),
                      child: CircularProgressIndicator(),
                    ),
                  ),
                  error: (error, _) => Text(
                    'Error checking permission: $error',
                    style: TextStyle(color: context.colorScheme.error),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Scheduled Notifications Info
            Text(
              'Status',
              style: context.textTheme.titleSmall?.copyWith(
                color: context.colorScheme.primary,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: scheduledCountAsync.when(
                  data: (count) => Row(
                    children: [
                      Icon(
                        Icons.schedule,
                        color: context.colorScheme.onSurface
                            .withValues(alpha: 0.6),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Scheduled Notifications',
                              style: context.textTheme.bodyLarge?.copyWith(
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              count == 0
                                  ? 'No notifications scheduled'
                                  : '$count notification${count == 1 ? '' : 's'} pending',
                              style: context.textTheme.bodySmall?.copyWith(
                                color: context.colorScheme.onSurface
                                    .withValues(alpha: 0.6),
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (count > 0)
                        TextButton(
                          onPressed: () async {
                            await ref
                                .read(notificationActionsProvider.notifier)
                                .cancelAll();
                            if (context.mounted) {
                              context.showInfoToast('All notifications cleared');
                            }
                          },
                          child: const Text('Clear All'),
                        ),
                    ],
                  ),
                  loading: () => const Center(
                    child: Padding(
                      padding: EdgeInsets.all(8),
                      child: CircularProgressIndicator(),
                    ),
                  ),
                  error: (error, _) => Text('Error: $error'),
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Test Notifications Section
            Text(
              'Test Notifications',
              style: context.textTheme.titleSmall?.copyWith(
                color: context.colorScheme.primary,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Card(
              child: Column(
                children: [
                  _TestNotificationTile(
                    icon: Icons.notifications_outlined,
                    title: 'General Notification',
                    subtitle: 'Standard notification on the general channel',
                    onTap: () async {
                      await ref
                          .read(notificationActionsProvider.notifier)
                          .sendTestNotification(
                            title: 'Hello from Turbo Template',
                            body: 'This is a general notification.',
                            channelKey: NotificationChannels.general,
                            payload: {'screen': 'home'},
                          );
                    },
                  ),
                  const Divider(height: 1),
                  _TestNotificationTile(
                    icon: Icons.alarm,
                    title: 'Reminder Notification',
                    subtitle: 'Simulates a scheduled reminder',
                    onTap: () async {
                      await ref
                          .read(notificationActionsProvider.notifier)
                          .sendTestNotification(
                            title: 'Reminder',
                            body: 'Don\'t forget to complete your tasks!',
                            channelKey: NotificationChannels.reminders,
                            payload: {'screen': 'todos'},
                          );
                    },
                  ),
                  const Divider(height: 1),
                  _TestNotificationTile(
                    icon: Icons.warning_amber_outlined,
                    title: 'Alert Notification',
                    subtitle: 'High-priority alert with vibration',
                    onTap: () async {
                      await ref
                          .read(notificationActionsProvider.notifier)
                          .sendTestNotification(
                            title: 'Important Alert',
                            body: 'This requires your immediate attention.',
                            channelKey: NotificationChannels.alerts,
                            payload: {'screen': 'settings'},
                          );
                    },
                  ),
                  const Divider(height: 1),
                  _TestNotificationTile(
                    icon: Icons.touch_app_outlined,
                    title: 'Notification with Actions',
                    subtitle: 'Includes tap-able action buttons',
                    onTap: () async {
                      final service = ref.read(notificationServiceProvider);
                      await service.showNotification(
                        NotificationConfig(
                          title: 'New Task Available',
                          body: 'Would you like to view it now?',
                          channelKey: NotificationChannels.general,
                          payload: {'screen': 'todos', 'action': 'view'},
                          actionButtons: [
                            NotificationActionButton(
                              key: 'VIEW',
                              label: 'View',
                            ),
                            NotificationActionButton(
                              key: 'DISMISS',
                              label: 'Dismiss',
                              autoDismissible: true,
                              actionType: ActionType.DismissAction,
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                  const Divider(height: 1),
                  _TestNotificationTile(
                    icon: Icons.timer_outlined,
                    title: 'Scheduled Notification (5s)',
                    subtitle: 'Fires after a 5-second delay',
                    onTap: () async {
                      final service = ref.read(notificationServiceProvider);
                      await service.scheduleNotification(
                        ScheduledNotificationConfig(
                          notificationConfig: const NotificationConfig(
                            title: 'Scheduled Reminder',
                            body: 'This was scheduled 5 seconds ago.',
                            channelKey: NotificationChannels.reminders,
                          ),
                          schedule: NotificationInterval(
                            interval: const Duration(seconds: 5),
                            preciseAlarm: true,
                          ),
                        ),
                      );
                      ref.invalidate(scheduledNotificationCountProvider);
                      if (context.mounted) {
                        context.showInfoToast(
                            'Notification scheduled for 5 seconds from now');
                      }
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Actions Section
            Text(
              'Actions',
              style: context.textTheme.titleSmall?.copyWith(
                color: context.colorScheme.primary,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Card(
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.cleaning_services_outlined),
                    title: const Text('Clear All Notifications'),
                    subtitle: const Text(
                        'Cancel all scheduled and displayed notifications'),
                    onTap: () async {
                      await ref
                          .read(notificationActionsProvider.notifier)
                          .cancelAll();
                      if (context.mounted) {
                        context.showSuccessToast('All notifications cleared');
                      }
                    },
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.badge_outlined),
                    title: const Text('Reset Badge Count'),
                    subtitle: const Text('Reset the app icon badge to zero'),
                    onTap: () async {
                      await ref
                          .read(notificationActionsProvider.notifier)
                          .resetBadge();
                      if (context.mounted) {
                        context.showSuccessToast('Badge count reset');
                      }
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}

/// Displays the current notification permission status with an action button.
class _PermissionStatus extends StatelessWidget {
  const _PermissionStatus({
    required this.isGranted,
    required this.onRequest,
  });

  final bool isGranted;
  final VoidCallback onRequest;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(
          isGranted ? Icons.check_circle : Icons.warning_amber_rounded,
          color: isGranted
              ? Colors.green
              : Theme.of(context).colorScheme.error,
          size: 28,
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                isGranted ? 'Notifications Enabled' : 'Notifications Disabled',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w500,
                    ),
              ),
              const SizedBox(height: 2),
              Text(
                isGranted
                    ? 'You will receive push notifications.'
                    : 'Tap the button below to enable notifications.',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Theme.of(context)
                          .colorScheme
                          .onSurface
                          .withValues(alpha: 0.6),
                    ),
              ),
            ],
          ),
        ),
        if (!isGranted)
          FilledButton(
            onPressed: onRequest,
            child: const Text('Enable'),
          ),
      ],
    );
  }
}

/// A list tile for triggering test notifications.
class _TestNotificationTile extends StatelessWidget {
  const _TestNotificationTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon),
      title: Text(title),
      subtitle: Text(subtitle),
      trailing: const Icon(Icons.send_outlined, size: 20),
      onTap: onTap,
    );
  }
}
