"""
DeletionRequest model mapping to shared Drizzle-managed table.
Unmanaged; schema and indexes are owned by Drizzle in packages/db.
"""
from django.db import models


class DeletionRequest(models.Model):
    id = models.CharField(max_length=255, primary_key=True)
    product_id = models.CharField(max_length=255)
    pharmacy_id = models.CharField(max_length=255)
    requested_by = models.CharField(max_length=255)
    reviewed_by = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=50)
    reason = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        db_table = "deletion_requests"
        managed = False
        ordering = ["-created_at"]


