import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:introduction_screen/introduction_screen.dart';
import 'package:mobile/core/extensions/context_extensions.dart';
import 'package:mobile/features/onboarding/presentation/providers/onboarding_provider.dart';

/// Onboarding screen that introduces new users to the app.
///
/// This screen is shown only on first app launch. Once completed,
/// the user won't see it again unless they reset their preferences.
class OnboardingScreen extends ConsumerWidget {
  const OnboardingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return IntroductionScreen(
      pages: _buildPages(context),
      onDone: () => _onOnboardingComplete(context, ref),
      onSkip: () => _onOnboardingComplete(context, ref),
      showSkipButton: true,
      skip: Text(
        'Skip',
        style: TextStyle(
          color: context.colorScheme.primary,
          fontWeight: FontWeight.w500,
        ),
      ),
      next: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: context.colorScheme.primary,
          shape: BoxShape.circle,
        ),
        child: Icon(
          Icons.arrow_forward,
          color: context.colorScheme.onPrimary,
          size: 20,
        ),
      ),
      done: Container(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        decoration: BoxDecoration(
          color: context.colorScheme.primary,
          borderRadius: BorderRadius.circular(24),
        ),
        child: Text(
          'Get Started',
          style: TextStyle(
            color: context.colorScheme.onPrimary,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      dotsDecorator: DotsDecorator(
        size: const Size(10.0, 10.0),
        color: context.colorScheme.outline,
        activeSize: const Size(24.0, 10.0),
        activeColor: context.colorScheme.primary,
        activeShape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(5.0),
        ),
      ),
      globalBackgroundColor: context.colorScheme.surface,
      curve: Curves.easeInOut,
      controlsMargin: const EdgeInsets.all(24),
      dotsContainerDecorator: BoxDecoration(
        color: context.colorScheme.surface,
      ),
    );
  }

  List<PageViewModel> _buildPages(BuildContext context) {
    return [
      _buildPage(
        context,
        title: 'Welcome to Turbo Template',
        body:
            'A powerful Flutter template built with modern architecture patterns and best practices for rapid app development.',
        icon: Icons.rocket_launch_rounded,
        iconColor: context.colorScheme.primary,
      ),
      _buildPage(
        context,
        title: 'Seamless Synchronization',
        body:
            'Your data stays in sync across all your devices. Work offline and changes will automatically sync when you reconnect.',
        icon: Icons.sync_rounded,
        iconColor: context.colorScheme.tertiary,
      ),
      _buildPage(
        context,
        title: 'Secure & Private',
        body:
            'Your data is protected with industry-standard encryption. We prioritize your privacy and security.',
        icon: Icons.shield_rounded,
        iconColor: context.colorScheme.secondary,
      ),
      _buildPage(
        context,
        title: 'Ready to Get Started?',
        body:
            'Sign in to access your account or create a new one to begin your journey with Turbo Template.',
        icon: Icons.check_circle_rounded,
        iconColor: context.colorScheme.primary,
      ),
    ];
  }

  PageViewModel _buildPage(
    BuildContext context, {
    required String title,
    required String body,
    required IconData icon,
    required Color iconColor,
  }) {
    return PageViewModel(
      titleWidget: Padding(
        padding: const EdgeInsets.only(top: 24),
        child: Text(
          title,
          style: context.textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.bold,
            color: context.colorScheme.onSurface,
          ),
          textAlign: TextAlign.center,
        ),
      ),
      bodyWidget: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Text(
          body,
          style: context.textTheme.bodyLarge?.copyWith(
            color: context.colorScheme.onSurface.withValues(alpha: 0.7),
            height: 1.5,
          ),
          textAlign: TextAlign.center,
        ),
      ),
      image: _buildImage(context, icon, iconColor),
      decoration: PageDecoration(
        imagePadding: const EdgeInsets.only(top: 80, bottom: 24),
        contentMargin: const EdgeInsets.symmetric(horizontal: 16),
        pageColor: context.colorScheme.surface,
      ),
    );
  }

  Widget _buildImage(BuildContext context, IconData icon, Color color) {
    return Container(
      width: 200,
      height: 200,
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        shape: BoxShape.circle,
      ),
      child: Center(
        child: Container(
          width: 140,
          height: 140,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.2),
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Icon(
              icon,
              size: 80,
              color: color,
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _onOnboardingComplete(BuildContext context, WidgetRef ref) async {
    await ref.read(onboardingStateProvider.notifier).completeOnboarding();
    if (context.mounted) {
      context.go('/login');
    }
  }
}
