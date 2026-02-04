import 'dart:io';

import 'package:cookie_jar/cookie_jar.dart';
import 'package:dio/dio.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/services/api/api_interceptors.dart';
import 'package:mobile/services/storage/secure_storage_service.dart';
import 'package:path_provider/path_provider.dart';

final dioProvider = Provider<Dio>((ref) {
  throw UnimplementedError('dioProvider must be overridden at app startup');
});

Future<Dio> createDio(SecureStorageService storage) async {
  final dio = Dio(
    BaseOptions(
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      sendTimeout: const Duration(seconds: 30),
      contentType: ContentType.json.toString(),
      responseType: ResponseType.json,
    ),
  );

  // File-based cookie persistence
  final appDocDir = await getApplicationDocumentsDirectory();
  final cookieJar = PersistCookieJar(
    storage: FileStorage('${appDocDir.path}/.cookies/'),
  );
  dio.interceptors.add(CookieManager(cookieJar));

  // Custom interceptors
  dio.interceptors.addAll([
    AuthInterceptor(storage),
    ResponseInterceptor(),
    LoggingInterceptor(),
  ]);

  return dio;
}
