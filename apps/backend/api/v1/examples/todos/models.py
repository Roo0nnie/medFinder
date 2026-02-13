from django.db import models
from django.conf import settings


class Todo(models.Model):
    title = models.CharField(max_length=255)
    completed = models.BooleanField(default=False)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="todos",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-completed", "-updated_at"]
        db_table = "todos"
