import 'package:freezed_annotation/freezed_annotation.dart';
import 'user_model.dart';

part 'session_model.freezed.dart';
part 'session_model.g.dart';

@freezed
abstract class SessionModel with _$SessionModel {
  const factory SessionModel({
    required SessionData session,
    required UserModel user,
  }) = _SessionModel;

  factory SessionModel.fromJson(Map<String, dynamic> json) => _$SessionModelFromJson(json);
}

@freezed
abstract class SessionData with _$SessionData {
  const factory SessionData({
    required String id,
    required String token,
    required String userId,
    required DateTime expiresAt,
    String? ipAddress,
    String? userAgent,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) = _SessionData;

  factory SessionData.fromJson(Map<String, dynamic> json) => _$SessionDataFromJson(json);
}
