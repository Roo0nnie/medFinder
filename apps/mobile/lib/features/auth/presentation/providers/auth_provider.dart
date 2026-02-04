import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:mobile/features/auth/data/auth_repository.dart';
import 'package:mobile/features/auth/data/models/session_model.dart';
import 'package:mobile/features/auth/data/models/user_model.dart';

part 'auth_provider.g.dart';

@Riverpod(keepAlive: true)
class AuthState extends _$AuthState {
  @override
  Future<SessionModel?> build() async {
    return ref.read(authRepositoryProvider).getSession();
  }

  Future<void> signIn({
    required String email,
    required String password,
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(authRepositoryProvider).signIn(
            email: email,
            password: password,
          ),
    );
  }

  Future<void> signUp({
    required String email,
    required String password,
    required String name,
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(authRepositoryProvider).signUp(
            email: email,
            password: password,
            name: name,
          ),
    );
  }

  Future<void> signOut() async {
    await ref.read(authRepositoryProvider).signOut();
    state = const AsyncData(null);
  }
}

@riverpod
// ignore: deprecated_member_use_from_same_package
bool isAuthenticated(IsAuthenticatedRef ref) {
  final authState = ref.watch(authStateProvider);
  return authState.valueOrNull != null;
}

@riverpod
// ignore: deprecated_member_use_from_same_package
UserModel? currentUser(CurrentUserRef ref) {
  final authState = ref.watch(authStateProvider);
  return authState.valueOrNull?.user;
}
