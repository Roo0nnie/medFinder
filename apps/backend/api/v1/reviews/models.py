"""
Review models mapping to shared Drizzle-managed tables.
Unmanaged; schema and indexes are owned by Drizzle in packages/db.
"""
from django.db import models


class PharmacyReview(models.Model):
    id = models.CharField(max_length=255, primary_key=True)
    pharmacy_id = models.CharField(max_length=255)
    user_id = models.CharField(max_length=255)
    rating = models.IntegerField()
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        db_table = "pharmacy_reviews"
        managed = False
        ordering = ["-created_at"]


class ProductReview(models.Model):
    id = models.CharField(max_length=255, primary_key=True)
    product_id = models.CharField(max_length=255)
    user_id = models.CharField(max_length=255)
    rating = models.IntegerField()
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        db_table = "product_reviews"
        managed = False
        ordering = ["-created_at"]


