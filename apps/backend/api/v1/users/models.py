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

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False


class BetterAuthSession(models.Model):
    """
    Session model mapped to Better Auth sessions table.
    Stored in plain text (32-char token) with expiry and user linkage.
    """

    id = models.CharField(max_length=255, primary_key=True)
    token = models.CharField(max_length=255, unique=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column="user_id", related_name="sessions")
    expires_at = models.DateTimeField(db_column="expires_at")
    created_at = models.DateTimeField(db_column="created_at")
    updated_at = models.DateTimeField(db_column="updated_at")

    class Meta:
        db_table = "sessions"
        managed = False
