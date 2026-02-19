"""
Root URLconf. All API routes under /api/
"""
from django.urls import path, include

from .views import root_view

urlpatterns = [
    path("", root_view),
    path("api/", include("api.urls")),
]
