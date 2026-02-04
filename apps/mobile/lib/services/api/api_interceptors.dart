import 'dart:developer' as developer;

import 'package:dio/dio.dart';
import 'package:mobile/services/storage/secure_storage_service.dart';

/// Injects Bearer token and sets Origin header to a backend trusted origin
/// so Better Auth's origin validation passes for mobile requests.
class AuthInterceptor extends Interceptor {
  final SecureStorageService _storage;

  AuthInterceptor(this._storage);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    // Better Auth requires a valid Origin header. Set it to the backend's
    // own origin which is always in the trustedOrigins list.
    options.headers['Origin'] = 'http://localhost:3000';

    final token = await _storage.getSessionToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }
}

/// Unwraps NestJS `{ success: true, data: ... }` envelope responses.
/// Only applies to non-auth routes (Better Auth returns raw JSON).
class ResponseInterceptor extends Interceptor {
  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    final path = response.requestOptions.uri.path;

    // Skip unwrapping for auth endpoints — Better Auth returns raw JSON.
    if (path.contains('/auth/')) {
      handler.next(response);
      return;
    }

    final data = response.data;
    if (data is Map<String, dynamic>) {
      if (data.containsKey('success') && data.containsKey('data')) {
        if (data['success'] == true) {
          response.data = data['data'];
        } else {
          final error = data['error'];
          final message = error is Map ? error['message'] : 'Request failed';
          handler.reject(
            DioException(
              requestOptions: response.requestOptions,
              response: response,
              message: message?.toString() ?? 'Request failed',
              type: DioExceptionType.badResponse,
            ),
          );
          return;
        }
      }
    }
    handler.next(response);
  }
}

/// Debug-only request/response logging.
class LoggingInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    developer.log(
      '>>> ${options.method} ${options.uri}',
      name: 'API',
    );
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    developer.log(
      '<<< ${response.statusCode} ${response.requestOptions.uri}\n'
      '    body: ${response.data}',
      name: 'API',
    );
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    developer.log(
      '!!! ${err.response?.statusCode ?? 'NO_STATUS'} ${err.requestOptions.uri} - ${err.message}',
      name: 'API',
      error: err,
    );
    handler.next(err);
  }
}
