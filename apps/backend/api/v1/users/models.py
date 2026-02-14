"""
User model mapping to the shared `users` table (used by better-auth / Drizzle).
Read/write for CRUD; not used as AUTH_USER_MODEL.
"""
from django.db import models


class User(models.Model):
    id = models.CharField(max_length=255, primary_key=True)
    email = models.EmailField(unique=True)
    email_verified = models.BooleanField(default=False)
    image = models.TextField(blank=True, null=True)
    first_name = models.CharField(max_length=255, blank=True, null=True)
    last_name = models.CharField(max_length=255)
    middle_name = models.CharField(max_length=255, blank=True, null=True)
    role = models.CharField(max_length=50, default="customer")
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        db_table = "users"
        managed = False
        ordering = ["-updated_at"]
