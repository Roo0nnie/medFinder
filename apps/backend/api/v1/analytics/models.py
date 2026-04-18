"""
Managed analytics tables (Django migrations are source of truth; keep Drizzle in sync).
"""

from django.db import models
from django.utils import timezone


class ProductPageEngagement(models.Model):
    """
    Client-reported product detail views / dwell time for owner analytics.
    """

    id = models.CharField(max_length=255, primary_key=True, editable=False)
    product_id = models.CharField(max_length=255, db_index=True)
    user_id = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    session_id = models.CharField(max_length=255, blank=True, null=True)
    dwell_seconds = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "product_page_engagements"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["product_id", "created_at"]),
        ]


class AuditEvent(models.Model):
    """
    Owner-scoped audit trail (staff actions, etc.).
    """

    id = models.CharField(max_length=255, primary_key=True, editable=False)
    owner_id = models.CharField(max_length=255, db_index=True)
    actor_user_id = models.CharField(max_length=255, blank=True, null=True)
    actor_role = models.CharField(max_length=32)
    action = models.CharField(max_length=64)
    resource_type = models.CharField(max_length=64)
    resource_id = models.CharField(max_length=255, blank=True, null=True)
    details = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "audit_events"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["owner_id", "created_at"]),
        ]


class ProductSearchSelection(models.Model):
    """
    Product opened from search results (for owner-level 'most searched products').
    """

    id = models.CharField(max_length=255, primary_key=True, editable=False)
    product_id = models.CharField(max_length=255, db_index=True)
    pharmacy_id = models.CharField(max_length=255, blank=True, null=True)
    owner_id = models.CharField(max_length=255, db_index=True)
    search_query = models.TextField(blank=True)
    customer_id = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "product_search_selections"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["owner_id", "product_id"]),
        ]
