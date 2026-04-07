"""
Product models mapping to shared tables.
Unmanaged; schema and indexes are owned by Drizzle in packages/db.
"""
from django.db import models


class ProductCategory(models.Model):
    id = models.CharField(max_length=255, primary_key=True)
    owner_id = models.CharField(max_length=255, db_column="owner_id")
    name = models.CharField(max_length=255)
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
    pharmacy_id = models.CharField(max_length=255, blank=True, null=True, db_column="pharmacy_id")
    name = models.CharField(max_length=255)
    generic_name = models.CharField(max_length=255, blank=True, null=True)
    brand_name = models.CharField(max_length=255, blank=True, null=True)
    brand_id = models.CharField(max_length=255, blank=True, null=True, db_column="brand_id")
    description = models.TextField(blank=True, null=True)
    manufacturer = models.CharField(max_length=255, blank=True, null=True)
    category_id = models.CharField(max_length=255)
    dosage_form = models.CharField(max_length=255, blank=True, null=True)
    strength = models.CharField(max_length=255, blank=True, null=True)
    unit = models.CharField(max_length=50)
    requires_prescription = models.BooleanField(default=False)
    image_url = models.TextField(blank=True, null=True)
    supplier = models.CharField(max_length=255, blank=True, null=True)
    low_stock_threshold = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        db_table = "medical_products"
        managed = False
        ordering = ["name"]


class MedicalProductVariant(models.Model):
    id = models.CharField(max_length=255, primary_key=True)
    product_id = models.CharField(max_length=255, db_column="product_id")
    label = models.CharField(max_length=255)
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        db_table = "medical_product_variants"
        managed = False
        ordering = ["sort_order", "label"]


class ProductSearch(models.Model):
    """
    Search telemetry events.
    """

    id = models.CharField(max_length=255, primary_key=True)
    customer_id = models.CharField(max_length=255, blank=True, null=True)
    search_query = models.TextField()
    results_count = models.IntegerField(default=0)
    searched_at = models.DateTimeField()

    class Meta:
        db_table = "product_searches"
        managed = False
        ordering = ["-searched_at"]
