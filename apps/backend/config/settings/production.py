"""
Production settings.
"""
import os

from .base import *

DEBUG = False

SECRET_KEY = os.environ.get("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY must be set in production")

ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "").split(",")
if not any(ALLOWED_HOSTS):
    raise ValueError("ALLOWED_HOSTS must be set in production")

# HTTPS origins for CSRF (e.g. https://api.example.com,https://app.example.com)
_csrf_origins = os.environ.get("CSRF_TRUSTED_ORIGINS", "")
CSRF_TRUSTED_ORIGINS = [o.strip() for o in _csrf_origins.split(",") if o.strip()]

STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")

_mw = list(MIDDLEWARE)
_sec = _mw.index("django.middleware.security.SecurityMiddleware")
_mw.insert(_sec + 1, "whitenoise.middleware.WhiteNoiseMiddleware")
MIDDLEWARE = _mw

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage",
    },
}
