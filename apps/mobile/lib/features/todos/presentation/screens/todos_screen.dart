import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/extensions/context_extensions.dart';
import 'package:mobile/features/todos/presentation/providers/todos_provider.dart';
import 'package:mobile/features/todos/presentation/widgets/create_todo_dialog.dart';
import 'package:mobile/features/todos/presentation/widgets/edit_todo_dialog.dart';
import 'package:mobile/features/todos/presentation/widgets/todo_card.dart';
import 'package:mobile/shared/dialogs/confirm_dialog.dart';
import 'package:mobile/shared/widgets/empty_state.dart';
import 'package:mobile/shared/widgets/error_display.dart';
import 'package:mobile/shared/widgets/loading_indicator.dart';

class TodosScreen extends ConsumerWidget {
  const TodosScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final todosAsync = ref.watch(todosListProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Todos'),
      ),
      body: todosAsync.when(
        loading: () => const LoadingIndicator(message: 'Loading todos...'),
        error: (error, _) => ErrorDisplay(
          message: error.toString(),
          onRetry: () => ref.read(todosListProvider.notifier).refresh(),
        ),
        data: (todos) {
          if (todos.isEmpty) {
            return const EmptyState(
              message: 'No todos yet.\nTap + to create one.',
              icon: Icons.checklist,
            );
          }

          return RefreshIndicator(
            onRefresh: () => ref.read(todosListProvider.notifier).refresh(),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: todos.length,
              separatorBuilder: (_, _) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final todo = todos[index];
                return TodoCard(
                  todo: todo,
                  onToggle: () async {
                    try {
                      await ref.read(todosListProvider.notifier).toggleTodo(todo);
                    } catch (e) {
                      if (context.mounted) {
                        context.showErrorSnackBar('Failed to update todo');
                      }
                    }
                  },
                  onEdit: () async {
                    final newTitle = await EditTodoDialog.show(context, todo);
                    if (newTitle != null && newTitle != todo.title) {
                      try {
                        await ref.read(todosListProvider.notifier).updateTodo(
                              todo.id,
                              title: newTitle,
                            );
                      } catch (e) {
                        if (context.mounted) {
                          context.showErrorSnackBar('Failed to update todo');
                        }
                      }
                    }
                  },
                  onDelete: () async {
                    final confirmed = await ConfirmDialog.show(
                      context,
                      title: 'Delete Todo',
                      content: 'Are you sure you want to delete "${todo.title}"?',
                      confirmLabel: 'Delete',
                      isDestructive: true,
                    );
                    if (confirmed) {
                      try {
                        await ref.read(todosListProvider.notifier).deleteTodo(todo.id);
                        if (context.mounted) {
                          context.showSnackBar('Todo deleted');
                        }
                      } catch (e) {
                        if (context.mounted) {
                          context.showErrorSnackBar('Failed to delete todo');
                        }
                      }
                    }
                  },
                );
              },
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          final title = await CreateTodoDialog.show(context);
          if (title != null) {
            try {
              await ref.read(todosListProvider.notifier).createTodo(title: title);
            } catch (e) {
              if (context.mounted) {
                context.showErrorSnackBar('Failed to create todo');
              }
            }
          }
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}
