"""
Brand tables (unmanaged; schema owned by Drizzle).
"""
from django.db import models


class Brand(models.Model):
    id = models.CharField(max_length=255, primary_key=True)
    name = models.CharField(max_length=255)
    normalized_name = models.CharField(max_length=255, db_column="normalized_name")
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        db_table = "brands"
        managed = False
        ordering = ["name"]


class OwnerBrand(models.Model):
    id = models.CharField(max_length=255, primary_key=True)
    owner_id = models.CharField(max_length=255, db_column="owner_id")
    brand_id = models.CharField(max_length=255, db_column="brand_id")
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        db_table = "owner_brands"
        managed = False
