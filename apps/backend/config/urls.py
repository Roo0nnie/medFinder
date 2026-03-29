"""
Root URLconf. All API routes under /api/
"""
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include

from .views import root_view

urlpatterns = [
    path("", root_view),
    path("api/", include("api.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
