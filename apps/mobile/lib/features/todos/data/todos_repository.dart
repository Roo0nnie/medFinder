import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/constants/api_constants.dart';
import 'package:mobile/features/todos/data/models/todo_model.dart';
import 'package:mobile/services/api/api_client.dart';

final todosRepositoryProvider = Provider<TodosRepository>((ref) {
  return TodosRepository(dio: ref.watch(dioProvider));
});

class TodosRepository {
  final Dio _dio;

  TodosRepository({required Dio dio}) : _dio = dio;

  Future<List<TodoModel>> fetchAll() async {
    final response = await _dio.get(ApiConstants.todos);
    final list = response.data as List<dynamic>;
    return list
        .map((item) => TodoModel.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<TodoModel> create({
    required String title,
    bool completed = false,
  }) async {
    final response = await _dio.post(
      ApiConstants.todos,
      data: {'title': title, 'completed': completed},
    );
    return TodoModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<TodoModel> update(int id, {String? title, bool? completed}) async {
    final data = <String, dynamic>{};
    if (title != null) data['title'] = title;
    if (completed != null) data['completed'] = completed;

    final response = await _dio.patch(
      ApiConstants.todoById(id),
      data: data,
    );
    return TodoModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<TodoModel> delete(int id) async {
    final response = await _dio.delete(ApiConstants.todoById(id));
    return TodoModel.fromJson(response.data as Map<String, dynamic>);
  }
}
