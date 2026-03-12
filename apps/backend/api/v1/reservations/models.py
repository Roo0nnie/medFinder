"""
Reservation models mapping to shared Drizzle-managed tables.
Unmanaged; schema and indexes are owned by Drizzle in packages/db.
"""
from django.db import models


class ProductReservation(models.Model):
    id = models.CharField(max_length=255, primary_key=True)
    customer_id = models.CharField(max_length=255)
    inventory_id = models.CharField(max_length=255)
    quantity = models.IntegerField()
    status = models.CharField(max_length=50)
    expires_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        db_table = "product_reservations"
        managed = False
        ordering = ["-created_at"]


