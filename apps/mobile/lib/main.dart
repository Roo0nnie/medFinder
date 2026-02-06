import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/app.dart';
import 'package:mobile/services/api/api_client.dart';
import 'package:mobile/services/storage/secure_storage_service.dart';
import 'package:mobile/services/storage/theme_storage_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Load environment variables
  await dotenv.load(fileName: '.env');

  // Initialize services in parallel for faster startup
  final results = await Future.wait([
    SharedPreferences.getInstance(),
    Future.value(SecureStorageService()),
  ]);

  final sharedPreferences = results[0] as SharedPreferences;
  final storage = results[1] as SecureStorageService;
  final dio = await createDio(storage);

  runApp(
    ProviderScope(
      overrides: [
        sharedPreferencesProvider.overrideWithValue(sharedPreferences),
        secureStorageProvider.overrideWithValue(storage),
        dioProvider.overrideWithValue(dio),
      ],
      child: const App(),
    ),
  );
}
