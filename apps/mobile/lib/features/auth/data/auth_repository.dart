import 'dart:developer' as developer;

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/constants/api_constants.dart';
import 'package:mobile/features/auth/data/models/session_model.dart';
import 'package:mobile/services/api/api_client.dart';
import 'package:mobile/services/storage/secure_storage_service.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(
    dio: ref.watch(dioProvider),
    storage: ref.watch(secureStorageProvider),
  );
});

class AuthRepository {
  final Dio _dio;
  final SecureStorageService _storage;

  AuthRepository({
    required Dio dio,
    required SecureStorageService storage,
  })  : _dio = dio,
        _storage = storage;

  Future<SessionModel> signIn({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _dio.post(
        ApiConstants.signIn,
        data: {'email': email, 'password': password},
      );

      developer.log('signIn response: ${response.data}', name: 'AuthRepo');

      await _extractAndStoreToken(response);
      return _parseSessionOrFetch(response.data);
    } on DioException catch (e) {
      throw Exception(_extractErrorMessage(e, 'Sign in failed'));
    }
  }

  Future<SessionModel> signUp({
    required String email,
    required String password,
    required String name,
  }) async {
    try {
      final response = await _dio.post(
        ApiConstants.signUp,
        data: {'email': email, 'password': password, 'name': name},
      );

      developer.log('signUp response: ${response.data}', name: 'AuthRepo');

      await _extractAndStoreToken(response);
      return _parseSessionOrFetch(response.data);
    } on DioException catch (e) {
      throw Exception(_extractErrorMessage(e, 'Sign up failed'));
    }
  }

  Future<void> signOut() async {
    try {
      await _dio.post(ApiConstants.signOut);
    } finally {
      await _storage.clearSessionToken();
    }
  }

  Future<SessionModel?> getSession() async {
    try {
      final response = await _dio.get(ApiConstants.getSession);

      developer.log('getSession response: ${response.data}', name: 'AuthRepo');

      final data = response.data;
      if (data == null) return null;
      if (data is! Map<String, dynamic>) return null;
      if (!data.containsKey('session') || !data.containsKey('user')) return null;
      if (data['session'] == null || data['user'] == null) return null;

      return SessionModel.fromJson(data);
    } on DioException {
      return null;
    } catch (e) {
      developer.log('getSession parse error: $e', name: 'AuthRepo');
      return null;
    }
  }

  Future<SessionModel> _parseSessionOrFetch(dynamic data) async {
    if (data == null) {
      throw Exception('Empty response from server');
    }
    if (data is! Map<String, dynamic>) {
      throw Exception('Unexpected response format');
    }

    final hasUser = data['user'] != null;
    final hasToken = data['token'] != null;
    final hasSession = data['session'] != null;

    // Handle Better Auth format: { token, user } at top level
    if (hasUser && hasToken && !hasSession) {
      // Transform to SessionModel format
      final user = data['user'] as Map<String, dynamic>;
      return SessionModel.fromJson({
        'session': {
          'id': '', // Better Auth doesn't provide session ID in sign-in response
          'token': data['token'],
          'userId': user['id'],
          'expiresAt': DateTime.now().add(const Duration(days: 30)).toIso8601String(),
          'createdAt': user['createdAt'],
          'updatedAt': user['updatedAt'],
        },
        'user': user,
      });
    }

    // Handle get-session format: { session, user }
    if (hasUser && hasSession) {
      return SessionModel.fromJson(data);
    }

    // Fallback to fetching session
    final session = await getSession();
    if (session == null) {
      if (!hasUser) {
        throw Exception('Invalid credentials');
      }
      throw Exception('No session returned');
    }

    return session;
  }

  String _extractErrorMessage(DioException e, String fallback) {
    if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout ||
        e.type == DioExceptionType.sendTimeout) {
      return 'Connection timed out. Check that the backend is running and reachable.';
    }
    if (e.type == DioExceptionType.connectionError) {
      return 'Cannot reach the server. Check your network connection.';
    }
    final data = e.response?.data;
    if (data is Map<String, dynamic>) {
      final message = data['message'] ?? data['error'];
      if (message is String) return message;
      if (message is Map) return message['message']?.toString() ?? fallback;
    }
    return fallback;
  }

  Future<void> _extractAndStoreToken(Response response) async {
    final data = response.data;
    
    // First try to extract token from response body (Better Auth format)
    if (data is Map<String, dynamic>) {
      // Check for token at top level
      if (data['token'] != null) {
        await _storage.setSessionToken(data['token'] as String);
        return;
      }
      // Check for token in session object
      final session = data['session'];
      if (session is Map<String, dynamic> && session['token'] != null) {
        await _storage.setSessionToken(session['token'] as String);
        return;
      }
    }

    // Fallback: extract token from Set-Cookie header
    final cookies = response.headers['set-cookie'];
    if (cookies != null) {
      for (final cookie in cookies) {
        final match = RegExp(r'better-auth\.session_token=([^;]+)').firstMatch(cookie);
        if (match != null) {
          await _storage.setSessionToken(match.group(1)!);
          return;
        }
      }
    }
  }
}
