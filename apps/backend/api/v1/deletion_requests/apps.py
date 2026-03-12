"""
Deletion requests app configuration.
"""
from django.apps import AppConfig


class DeletionRequestsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "api.v1.deletion_requests"
    label = "deletion_requests"


