"""
Staff app configuration.
"""
from django.apps import AppConfig


class StaffConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "api.v1.staff"
    label = "staff"
