import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile/services/storage/theme_storage_service.dart';

/// Provider for the onboarding storage service.
final onboardingStorageServiceProvider =
    Provider<OnboardingStorageService>((ref) {
  final prefs = ref.watch(sharedPreferencesProvider);
  return OnboardingStorageService(prefs);
});

/// Service for persisting onboarding completion state using SharedPreferences.
class OnboardingStorageService {
  OnboardingStorageService(this._prefs);

  final SharedPreferences _prefs;

  static const String _hasCompletedOnboardingKey = 'has_completed_onboarding';

  /// Checks if the user has completed onboarding.
  bool hasCompletedOnboarding() {
    return _prefs.getBool(_hasCompletedOnboardingKey) ?? false;
  }

  /// Marks onboarding as completed.
  Future<void> completeOnboarding() async {
    await _prefs.setBool(_hasCompletedOnboardingKey, true);
  }

  /// Resets onboarding state (useful for testing or allowing users to see it again).
  Future<void> resetOnboarding() async {
    await _prefs.remove(_hasCompletedOnboardingKey);
  }
}
