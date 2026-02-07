import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/core/navigation/persistent_nav_bar.dart';
import 'package:mobile/core/theme/theme_provider.dart';
import 'package:mobile/features/auth/presentation/providers/auth_provider.dart';
import 'package:mobile/features/auth/presentation/screens/login_screen.dart';
import 'package:mobile/features/auth/presentation/screens/register_screen.dart';
import 'package:mobile/features/onboarding/presentation/providers/onboarding_provider.dart';
import 'package:mobile/features/notifications/presentation/screens/notification_settings_screen.dart';
import 'package:mobile/features/onboarding/presentation/screens/onboarding_screen.dart';
import 'package:mobile/features/settings/presentation/screens/appearance_screen.dart';
import 'package:toastification/toastification.dart';

final _routerProvider = Provider<GoRouter>((ref) {
  final isAuthenticated = ref.watch(isAuthenticatedProvider);
  final hasCompletedOnboarding = ref.watch(hasCompletedOnboardingProvider);

  return GoRouter(
    initialLocation: '/onboarding',
    redirect: (context, state) {
      final onOnboardingRoute = state.uri.path == '/onboarding';
      final onAuthRoute =
          state.uri.path == '/login' || state.uri.path == '/register';

      // If onboarding hasn't been completed, redirect to onboarding
      // (unless already there)
      if (!hasCompletedOnboarding && !onOnboardingRoute) {
        return '/onboarding';
      }

      // If onboarding is completed but user tries to access it, redirect away
      if (hasCompletedOnboarding && onOnboardingRoute) {
        return isAuthenticated ? '/home' : '/login';
      }

      // Standard auth flow redirects (only after onboarding is complete)
      if (hasCompletedOnboarding) {
        if (!isAuthenticated && !onAuthRoute && !onOnboardingRoute) {
          return '/login';
        }

        if (isAuthenticated && onAuthRoute) {
          return '/home';
        }
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/onboarding',
        builder: (context, state) => const OnboardingScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      // Main app with persistent bottom navigation
      GoRoute(
        path: '/home',
        builder: (context, state) => const MainNavigation(),
      ),
      // Settings routes
      GoRoute(
        path: '/settings/appearance',
        builder: (context, state) => const AppearanceScreen(),
      ),
      GoRoute(
        path: '/settings/notifications',
        builder: (context, state) => const NotificationSettingsScreen(),
      ),
    ],
  );
});

/// Main navigation wrapper that contains the persistent bottom navigation bar.
///
/// This widget manages the bottom navigation and maintains state across tabs.
class MainNavigation extends StatelessWidget {
  const MainNavigation({super.key});

  @override
  Widget build(BuildContext context) {
    // Use the default Style1 navigation bar
    // You can switch to PersistentNavBarStyle3 or PersistentNavBarNeumorphic
    // for different visual styles.
    return const PersistentNavBar();
  }
}

class App extends ConsumerWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(_routerProvider);
    final themeMode = ref.watch(themeModeProvider);
    final lightTheme = ref.watch(lightThemeProvider);
    final darkTheme = ref.watch(darkThemeProvider);

    return ToastificationWrapper(
      config: ToastificationConfig(
        alignment: Alignment.topCenter,
        animationDuration: const Duration(milliseconds: 300),
        marginBuilder: (context, alignment) =>
            const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      ),
      child: MaterialApp.router(
        title: 'Turbo Template',
        debugShowCheckedModeBanner: false,
        theme: lightTheme,
        darkTheme: darkTheme,
        themeMode: themeMode,
        routerConfig: router,
      ),
    );
  }
}
