"""
Root URLconf. All API routes under /api/
"""
from django.urls import path, include

urlpatterns = [
    path("api/", include("api.urls")),
]
