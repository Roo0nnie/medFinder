import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/extensions/context_extensions.dart';
import 'package:mobile/core/theme/flex_theme_config.dart';
import 'package:mobile/core/theme/theme_provider.dart';
import 'package:mobile/shared/widgets/theme_mode_toggle.dart';

/// Screen for managing app appearance settings.
/// Allows users to select theme mode (light/dark/system) and color scheme.
class AppearanceScreen extends ConsumerWidget {
  const AppearanceScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeState = ref.watch(themeControllerProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Appearance'),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Theme Mode Section
            Text(
              'Theme Mode',
              style: context.textTheme.titleSmall?.copyWith(
                color: context.colorScheme.primary,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Choose how the app appears',
              style: context.textTheme.bodySmall?.copyWith(
                color: context.colorScheme.onSurface.withValues(alpha: 0.6),
              ),
            ),
            const SizedBox(height: 12),
            // Segmented button for theme mode selection
            const Center(
              child: ThemeModeSegmentedButton(),
            ),
            const SizedBox(height: 16),
            // Quick toggle for light/dark mode
            Card(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Row(
                  children: [
                    Icon(
                      Icons.dark_mode,
                      color: context.colorScheme.onSurfaceVariant,
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Dark Mode',
                            style: context.textTheme.bodyLarge,
                          ),
                          Text(
                            'Quick toggle for dark theme',
                            style: context.textTheme.bodySmall?.copyWith(
                              color: context.colorScheme.onSurface.withValues(alpha: 0.6),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const ThemeModeSwitch(),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Color Scheme Section
            Text(
              'Color Scheme',
              style: context.textTheme.titleSmall?.copyWith(
                color: context.colorScheme.primary,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Choose a color palette for the app',
              style: context.textTheme.bodySmall?.copyWith(
                color: context.colorScheme.onSurface.withValues(alpha: 0.6),
              ),
            ),
            const SizedBox(height: 12),
            _ColorSchemeGrid(
              selectedScheme: themeState.colorScheme,
              onSchemeSelected: (scheme) {
                ref
                    .read(themeControllerProvider.notifier)
                    .setColorScheme(scheme);
              },
            ),
            const SizedBox(height: 24),

            // Reset Button
            OutlinedButton.icon(
              onPressed: () async {
                final confirmed = await showDialog<bool>(
                  context: context,
                  builder: (context) => AlertDialog(
                    title: const Text('Reset to Defaults'),
                    content: const Text(
                      'This will reset the theme mode to System and the color scheme to the default. Continue?',
                    ),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(context, false),
                        child: const Text('Cancel'),
                      ),
                      FilledButton(
                        onPressed: () => Navigator.pop(context, true),
                        child: const Text('Reset'),
                      ),
                    ],
                  ),
                );
                if (confirmed == true) {
                  await ref
                      .read(themeControllerProvider.notifier)
                      .resetToDefaults();
                  if (context.mounted) {
                    context.showSnackBar('Theme reset to defaults');
                  }
                }
              },
              icon: const Icon(Icons.restore),
              label: const Text('Reset to Defaults'),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}

class _ColorSchemeGrid extends StatelessWidget {
  const _ColorSchemeGrid({
    required this.selectedScheme,
    required this.onSchemeSelected,
  });

  final AppColorScheme selectedScheme;
  final ValueChanged<AppColorScheme> onSchemeSelected;

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 4,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1,
      ),
      itemCount: AppColorScheme.values.length,
      itemBuilder: (context, index) {
        final scheme = AppColorScheme.values[index];
        final isSelected = scheme == selectedScheme;

        return _ColorSchemeButton(
          scheme: scheme,
          isSelected: isSelected,
          onTap: () => onSchemeSelected(scheme),
        );
      },
    );
  }
}

class _ColorSchemeButton extends StatelessWidget {
  const _ColorSchemeButton({
    required this.scheme,
    required this.isSelected,
    required this.onTap,
  });

  final AppColorScheme scheme;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: scheme.displayName,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          decoration: BoxDecoration(
            color: scheme.previewColor,
            borderRadius: BorderRadius.circular(12),
            border: isSelected
                ? Border.all(
                    color: context.colorScheme.onSurface,
                    width: 3,
                  )
                : null,
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: scheme.previewColor.withValues(alpha: 0.4),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : null,
          ),
          child: isSelected
              ? Center(
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.check,
                      color: scheme.previewColor,
                      size: 16,
                    ),
                  ),
                )
              : null,
        ),
      ),
    );
  }
}
