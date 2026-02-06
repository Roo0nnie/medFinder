import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/core/extensions/context_extensions.dart';
import 'package:mobile/core/theme/theme_provider.dart';
import 'package:mobile/features/auth/presentation/providers/auth_provider.dart';
import 'package:mobile/features/onboarding/presentation/providers/onboarding_provider.dart';
import 'package:mobile/shared/widgets/theme_mode_toggle.dart';

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
