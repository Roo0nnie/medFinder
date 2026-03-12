"""
Inventory models mapping to shared tables.
Unmanaged; schema and indexes are owned by Drizzle in packages/db.
"""
from django.db import models


class PharmacyInventory(models.Model):
    id = models.CharField(max_length=255, primary_key=True)
    pharmacy_id = models.CharField(max_length=255)
    product_id = models.CharField(max_length=255)
    quantity = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    expiry_date = models.DateTimeField(blank=True, null=True)
    batch_number = models.CharField(max_length=255, blank=True, null=True)
    is_available = models.BooleanField(default=True)
    last_restocked = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        db_table = "pharmacy_inventory"
        managed = False
        ordering = ["-updated_at"]

