"""
Staff model mapping to the shared `staff` table.
Read/write for CRUD operations.
"""
from django.db import models


class Staff(models.Model):
    id = models.CharField(max_length=255, primary_key=True)
    user_id = models.CharField(max_length=255)
    department = models.CharField(max_length=255)
    position = models.CharField(max_length=255)
    specialization = models.TextField(blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        db_table = "staff"
        managed = False
        ordering = ["-updated_at"]
        indexes = [
            models.Index(fields=["user_id"]),
            models.Index(fields=["is_active"]),
            models.Index(fields=["department"]),
            models.Index(fields=["position"]),
        ]
