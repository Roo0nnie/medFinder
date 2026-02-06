import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/core/extensions/context_extensions.dart';
import 'package:mobile/core/theme/theme_provider.dart';
import 'package:mobile/features/auth/presentation/providers/auth_provider.dart';
import 'package:mobile/features/onboarding/presentation/providers/onboarding_provider.dart';
import 'package:mobile/services/snackbar/snackbar_service.dart';
import 'package:mobile/services/toast/toast_service.dart';
import 'package:mobile/shared/widgets/theme_mode_toggle.dart';
import 'package:toastification/toastification.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
        actions: const [
          // Quick theme toggle in app bar
          ThemeModeIconButton(),
          SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Profile Section
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 32,
                      backgroundColor: context.colorScheme.primaryContainer,
                      child: Text(
                        (user?.name ?? 'U')[0].toUpperCase(),
                        style: context.textTheme.headlineSmall?.copyWith(
                          color: context.colorScheme.onPrimaryContainer,
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            user?.name ?? 'User',
                            style: context.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            user?.email ?? '',
                            style: context.textTheme.bodyMedium?.copyWith(
                              color: context.colorScheme.onSurface
                                  .withValues(alpha: 0.6),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Settings Sections
            Text(
              'Preferences',
              style: context.textTheme.titleSmall?.copyWith(
                color: context.colorScheme.primary,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Card(
              child: Column(
                children: [
                  _SettingsTile(
                    icon: Icons.notifications_outlined,
                    title: 'Notifications',
                    subtitle: 'Manage notification settings',
                    onTap: () {
                      context.showSnackBar('Notifications settings coming soon');
                    },
                  ),
                  const Divider(height: 1),
                  _SettingsTile(
                    icon: Icons.palette_outlined,
                    title: 'Appearance',
                    subtitle: ref.watch(themeModeDisplayNameProvider),
                    onTap: () {
                      context.push('/settings/appearance');
                    },
                  ),
                  const Divider(height: 1),
                  _SettingsTile(
                    icon: Icons.language_outlined,
                    title: 'Language',
                    subtitle: 'English',
                    onTap: () {
                      context.showSnackBar('Language settings coming soon');
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Account Section
            Text(
              'Account',
              style: context.textTheme.titleSmall?.copyWith(
                color: context.colorScheme.primary,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Card(
              child: Column(
                children: [
                  _SettingsTile(
                    icon: Icons.security_outlined,
                    title: 'Security',
                    subtitle: 'Password and authentication',
                    onTap: () {
                      context.showSnackBar('Security settings coming soon');
                    },
                  ),
                  const Divider(height: 1),
                  _SettingsTile(
                    icon: Icons.privacy_tip_outlined,
                    title: 'Privacy',
                    subtitle: 'Data and privacy settings',
                    onTap: () {
                      context.showSnackBar('Privacy settings coming soon');
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Support Section
            Text(
              'Support',
              style: context.textTheme.titleSmall?.copyWith(
                color: context.colorScheme.primary,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Card(
              child: Column(
                children: [
                  _SettingsTile(
                    icon: Icons.help_outline,
                    title: 'Help Center',
                    subtitle: 'Get help and support',
                    onTap: () {
                      context.showSnackBar('Help center coming soon');
                    },
                  ),
                  const Divider(height: 1),
                  _SettingsTile(
                    icon: Icons.info_outline,
                    title: 'About',
                    subtitle: 'App version and info',
                    onTap: () {
                      _showAboutDialog(context);
                    },
                  ),
                  const Divider(height: 1),
                  _SettingsTile(
                    icon: Icons.replay_outlined,
                    title: 'Replay Onboarding',
                    subtitle: 'View the introduction again',
                    onTap: () async {
                      await ref
                          .read(onboardingStateProvider.notifier)
                          .resetOnboarding();
                      if (context.mounted) {
                        context.go('/onboarding');
                      }
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Developer Section
            Text(
              'Developer',
              style: context.textTheme.titleSmall?.copyWith(
                color: context.colorScheme.primary,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Card(
              child: Column(
                children: [
                  _SettingsTile(
                    icon: Icons.flash_on_outlined,
                    title: 'Toast Demo',
                    subtitle: 'Lightweight confirmations (top overlay)',
                    onTap: () {
                      _showToastDemo(context, ref);
                    },
                  ),
                  const Divider(height: 1),
                  _SettingsTile(
                    icon: Icons.message_outlined,
                    title: 'Snackbar Demo',
                    subtitle: 'Actionable messages (bottom bar)',
                    onTap: () {
                      _showSnackbarDemo(context, ref);
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Sign Out Button
            FilledButton.tonal(
              onPressed: () async {
                await ref.read(authStateProvider.notifier).signOut();
              },
              style: FilledButton.styleFrom(
                foregroundColor: context.colorScheme.error,
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.logout),
                  SizedBox(width: 8),
                  Text('Sign Out'),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  void _showAboutDialog(BuildContext context) {
    showAboutDialog(
      context: context,
      applicationName: 'Turbo Template',
      applicationVersion: '1.0.0',
      applicationIcon: Icon(
        Icons.rocket_launch,
        size: 48,
        color: Theme.of(context).colorScheme.primary,
      ),
      children: [
        const Text('A modern Flutter mobile app template with clean architecture.'),
      ],
    );
  }

  void _showToastDemo(BuildContext context, WidgetRef ref) {
    final toastService = ref.read(toastServiceProvider);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => _ToastDemoSheet(toastService: toastService),
    );
  }

  void _showSnackbarDemo(BuildContext context, WidgetRef ref) {
    final snackbarService = ref.read(snackbarServiceProvider);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => _SnackbarDemoSheet(snackbarService: snackbarService),
    );
  }
}

/// Bottom sheet widget for demonstrating toast notifications.
///
/// Toasts are lightweight, non-interactive confirmations.
/// They appear at the top of the screen and auto-dismiss quickly.
/// Powered by the toastification package with theme-based colors.
class _ToastDemoSheet extends StatelessWidget {
  const _ToastDemoSheet({required this.toastService});

  final ToastService toastService;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Handle bar
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: colorScheme.onSurface.withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Title and description
            Text(
              'Toast Notifications',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'Lightweight, non-interactive confirmations.\n'
              'Appear at the top and auto-dismiss quickly.\n'
              'Use for: "Saved!", "Copied!", "Done!", etc.',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurface.withValues(alpha: 0.6),
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),

            // Toast type buttons - each shows a realistic use case
            _DemoButton(
              icon: Icons.check_circle_rounded,
              label: 'Saved!',
              subtitle: 'Success confirmation',
              color: colorScheme.primary,
              onTap: () {
                toastService.showSuccess(context, 'Changes saved');
              },
            ),
            const SizedBox(height: 10),

            _DemoButton(
              icon: Icons.error_rounded,
              label: 'Failed to upload',
              subtitle: 'Error notification',
              color: colorScheme.error,
              onTap: () {
                toastService.showError(context, 'Failed to upload');
              },
            ),
            const SizedBox(height: 10),

            _DemoButton(
              icon: Icons.warning_rounded,
              label: 'Low storage',
              subtitle: 'Warning alert',
              color: colorScheme.tertiary,
              onTap: () {
                toastService.showWarning(context, 'Storage almost full');
              },
            ),
            const SizedBox(height: 10),

            _DemoButton(
              icon: Icons.content_copy_rounded,
              label: 'Copied to clipboard',
              subtitle: 'Info confirmation',
              color: colorScheme.secondary,
              onTap: () {
                toastService.showInfo(context, 'Copied to clipboard');
              },
            ),
            const SizedBox(height: 16),

            // Style variants
            Text(
              'Style variants',
              style: theme.textTheme.labelLarge?.copyWith(
                color: colorScheme.onSurface.withValues(alpha: 0.5),
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 10),

            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      toastService.showSuccess(
                        context,
                        'Flat colored',
                        config: const ToastConfig(
                          style: ToastificationStyle.flatColored,
                        ),
                      );
                    },
                    child: const Text('Flat'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      toastService.showInfo(
                        context,
                        'Fill colored',
                        config: const ToastConfig(
                          style: ToastificationStyle.fillColored,
                        ),
                      );
                    },
                    child: const Text('Filled'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      toastService.showWarning(
                        context,
                        'Minimal style',
                        config: const ToastConfig(
                          style: ToastificationStyle.minimal,
                        ),
                      );
                    },
                    child: const Text('Minimal'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),

            // Dismiss all button
            OutlinedButton.icon(
              onPressed: () {
                toastService.dismissAll();
              },
              icon: const Icon(Icons.clear_all),
              label: const Text('Dismiss All Toasts'),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}

/// Bottom sheet widget for demonstrating snackbar notifications.
///
/// Snackbars are Material Design bottom bars with optional action buttons.
/// They are dismissible and used for messages that may require user action.
class _SnackbarDemoSheet extends StatelessWidget {
  const _SnackbarDemoSheet({required this.snackbarService});

  final SnackbarService snackbarService;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Handle bar
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: colorScheme.onSurface.withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Title and description
            Text(
              'Snackbar Notifications',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'Material Design bottom bars with action buttons.\n'
              'Dismissible by swiping. Used for undo, retry, etc.\n'
              'Use for: "Item deleted - Undo", "Error - Retry", etc.',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurface.withValues(alpha: 0.6),
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),

            // Snackbar type buttons - each shows a realistic use case
            _DemoButton(
              icon: Icons.delete_outline,
              label: 'Item deleted - Undo',
              subtitle: 'Success with action',
              color: colorScheme.primary,
              onTap: () {
                Navigator.of(context).pop();
                snackbarService.showSuccess(
                  context,
                  title: 'Item Deleted',
                  message: 'The item has been moved to trash.',
                  config: SnackbarConfig(
                    action: 'Undo',
                    onActionPressed: () {
                      snackbarService.showHelp(
                        context,
                        title: 'Restored',
                        message: 'Item has been restored successfully.',
                      );
                    },
                  ),
                );
              },
            ),
            const SizedBox(height: 10),

            _DemoButton(
              icon: Icons.wifi_off_rounded,
              label: 'Connection failed - Retry',
              subtitle: 'Error with action',
              color: colorScheme.error,
              onTap: () {
                Navigator.of(context).pop();
                snackbarService.showError(
                  context,
                  title: 'Connection Failed',
                  message: 'Unable to connect to the server.',
                  config: SnackbarConfig(
                    action: 'Retry',
                    onActionPressed: () {
                      snackbarService.showHelp(
                        context,
                        title: 'Retrying',
                        message: 'Attempting to reconnect...',
                      );
                    },
                  ),
                );
              },
            ),
            const SizedBox(height: 10),

            _DemoButton(
              icon: Icons.storage_outlined,
              label: 'Low storage - Manage',
              subtitle: 'Warning with action',
              color: colorScheme.tertiary,
              onTap: () {
                Navigator.of(context).pop();
                snackbarService.showWarning(
                  context,
                  title: 'Storage Almost Full',
                  message: 'Consider deleting some files.',
                  config: SnackbarConfig(
                    action: 'Manage',
                    onActionPressed: () {
                      snackbarService.showHelp(
                        context,
                        title: 'Storage Manager',
                        message: 'Opening storage manager...',
                      );
                    },
                  ),
                );
              },
            ),
            const SizedBox(height: 10),

            _DemoButton(
              icon: Icons.lightbulb_outline,
              label: 'Pro tip - Got it',
              subtitle: 'Help/info with action',
              color: colorScheme.secondary,
              onTap: () {
                Navigator.of(context).pop();
                snackbarService.showHelp(
                  context,
                  title: 'Pro Tip',
                  message: 'Swipe left or right to dismiss snackbars!',
                  config: SnackbarConfig(
                    action: 'Got it',
                    onActionPressed: () {},
                  ),
                );
              },
            ),
            const SizedBox(height: 16),

            // Material Banner demo
            Text(
              'Banner variant',
              style: theme.textTheme.labelLarge?.copyWith(
                color: colorScheme.onSurface.withValues(alpha: 0.5),
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 10),

            OutlinedButton.icon(
              onPressed: () {
                Navigator.of(context).pop();
                snackbarService.showWarning(
                  context,
                  title: 'Update Available',
                  message: 'A new version is available. Update now for the latest features!',
                  config: const SnackbarConfig(
                    inMaterialBanner: true,
                    action: 'Update',
                  ),
                );
              },
              icon: const Icon(Icons.system_update),
              label: const Text('Show as Material Banner (top)'),
            ),
            const SizedBox(height: 10),

            // Dismiss button
            OutlinedButton.icon(
              onPressed: () {
                snackbarService.hide(context);
                snackbarService.hideBanner(context);
                Navigator.of(context).pop();
              },
              icon: const Icon(Icons.clear_all),
              label: const Text('Dismiss All'),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}

/// A styled button for the demo bottom sheets.
class _DemoButton extends StatelessWidget {
  const _DemoButton({
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return FilledButton(
      onPressed: onTap,
      style: FilledButton.styleFrom(
        backgroundColor: color.withValues(alpha: 0.12),
        foregroundColor: color,
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
      child: Row(
        children: [
          Icon(icon, size: 22),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w400,
                    color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
                  ),
                ),
              ],
            ),
          ),
          Icon(
            Icons.chevron_right,
            size: 18,
            color: color.withValues(alpha: 0.5),
          ),
        ],
      ),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  const _SettingsTile({
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
      trailing: const Icon(Icons.chevron_right),
      onTap: onTap,
    );
  }
}
