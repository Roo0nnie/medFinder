// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'onboarding_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$hasCompletedOnboardingHash() =>
    r'95d80a5f830f1d5851a31f5ac276a243c5b60052';

/// Convenience provider to check if onboarding has been completed.
///
/// Copied from [hasCompletedOnboarding].
@ProviderFor(hasCompletedOnboarding)
final hasCompletedOnboardingProvider = AutoDisposeProvider<bool>.internal(
  hasCompletedOnboarding,
  name: r'hasCompletedOnboardingProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$hasCompletedOnboardingHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef HasCompletedOnboardingRef = AutoDisposeProviderRef<bool>;
String _$onboardingStateHash() => r'01e9bb879864890e25b665b7725bd65ab31b45d7';

/// Provider that manages onboarding completion state.
///
/// This provider is kept alive to maintain state throughout the app lifecycle.
/// It reads and writes to SharedPreferences via OnboardingStorageService.
///
/// Copied from [OnboardingState].
@ProviderFor(OnboardingState)
final onboardingStateProvider =
    NotifierProvider<OnboardingState, bool>.internal(
      OnboardingState.new,
      name: r'onboardingStateProvider',
      debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
          ? null
          : _$onboardingStateHash,
      dependencies: null,
      allTransitiveDependencies: null,
    );

typedef _$OnboardingState = Notifier<bool>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
