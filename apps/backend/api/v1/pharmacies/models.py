"""
Pharmacy and PharmacyStaff models mapping to shared tables.
"""
from django.db import models


class Pharmacy(models.Model):
    id = models.CharField(max_length=255, primary_key=True)
    owner_id = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    address = models.TextField()
    city = models.CharField(max_length=255)
    state = models.CharField(max_length=255)
    zip_code = models.CharField(max_length=50)
    country = models.CharField(max_length=100, default="US")
    logo = models.TextField(blank=True, null=True)
    owner_image = models.TextField(blank=True, null=True)
    google_map_embed = models.TextField(blank=True, null=True)
    social_links = models.TextField(blank=True, null=True)
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    website = models.TextField(blank=True, null=True)
    operating_hours = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        db_table = "pharmacies"
        managed = False
        ordering = ["-updated_at"]


class PharmacyStaff(models.Model):
    id = models.CharField(max_length=255, primary_key=True)
    pharmacy_id = models.CharField(max_length=255)
    staff_id = models.CharField(max_length=255)
    assigned_at = models.DateTimeField()

    class Meta:
        db_table = "pharmacy_staff"
        managed = False
        ordering = ["-assigned_at"]

