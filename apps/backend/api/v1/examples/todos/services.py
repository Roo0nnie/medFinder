"""
Todo business logic (same behavior as NestJS TodosService).
"""
from .models import Todo


def get_all_todos():
    return Todo.objects.all().order_by("-completed", "-updated_at")


def get_todo_by_id(pk):
    return Todo.objects.get(pk=pk)  # raises Todo.DoesNotExist -> 404 in view


def create_todo(*, title, completed=False, author_id):
    return Todo.objects.create(
        title=title,
        completed=completed,
        author_id=author_id,
    )


def update_todo(pk, *, title=None, completed=None):
    todo = Todo.objects.get(pk=pk)
    if title is not None:
        todo.title = title
    if completed is not None:
        todo.completed = completed
    todo.save(update_fields=["title", "completed", "updated_at"])
    return todo


def delete_todo(pk):
    todo = Todo.objects.get(pk=pk)  # raises Todo.DoesNotExist if not found
    todo.delete()
    return {"success": True, "id": int(pk)}
