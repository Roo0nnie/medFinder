"""
Product models mapping to shared tables.
Unmanaged; schema and indexes are owned by Drizzle in packages/db.
"""
from django.db import models


class ProductCategory(models.Model):
    id = models.CharField(max_length=255, primary_key=True)
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True, null=True)
    parent_category_id = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        db_table = "product_categories"
        managed = False
        ordering = ["name"]


class MedicalProduct(models.Model):
    id = models.CharField(max_length=255, primary_key=True)
    name = models.CharField(max_length=255)
    generic_name = models.CharField(max_length=255, blank=True, null=True)
    brand_name = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    manufacturer = models.CharField(max_length=255, blank=True, null=True)
    category_id = models.CharField(max_length=255)
    dosage_form = models.CharField(max_length=255, blank=True, null=True)
    strength = models.CharField(max_length=255, blank=True, null=True)
    unit = models.CharField(max_length=50)
    requires_prescription = models.BooleanField(default=False)
    image_url = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        db_table = "medical_products"
        managed = False
        ordering = ["name"]

