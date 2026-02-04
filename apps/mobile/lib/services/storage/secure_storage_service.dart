import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final secureStorageProvider = Provider<SecureStorageService>((ref) {
  return SecureStorageService();
});

class SecureStorageService {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  static const _sessionTokenKey = 'auth_session_token';

  Future<String?> getSessionToken() => _storage.read(key: _sessionTokenKey);

  Future<void> setSessionToken(String token) =>
      _storage.write(key: _sessionTokenKey, value: token);

  Future<void> clearSessionToken() => _storage.delete(key: _sessionTokenKey);

  Future<void> clearAll() => _storage.deleteAll();
}
