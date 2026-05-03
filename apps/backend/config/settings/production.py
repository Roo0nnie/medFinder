"""
Production settings.
"""
import os
from urllib.parse import urlparse

from .base import *

DEBUG = False

SECRET_KEY = os.environ.get("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY must be set in production")


def _comma_separated_hosts(key: str) -> list[str]:
    return [h.strip() for h in os.environ.get(key, "").split(",") if h.strip()]


ALLOWED_HOSTS = _comma_separated_hosts("ALLOWED_HOSTS")
# Render sets RENDER_EXTERNAL_HOSTNAME (e.g. myapp.onrender.com) on web services.
# Merging it avoids DisallowedHost / plain 400 when ALLOWED_HOSTS was only local dev values.
_render_hostname = os.environ.get("RENDER_EXTERNAL_HOSTNAME", "").strip()
if _render_hostname and _render_hostname not in ALLOWED_HOSTS:
    ALLOWED_HOSTS = [*ALLOWED_HOSTS, _render_hostname]

if not any(ALLOWED_HOSTS):
    raise ValueError(
        "ALLOWED_HOSTS must be set in production (or deploy on Render with "
        "RENDER_EXTERNAL_HOSTNAME set automatically)"
    )

# HTTPS origins for CSRF (e.g. https://api.example.com,https://app.example.com)
_csrf_origins = os.environ.get("CSRF_TRUSTED_ORIGINS", "")
CSRF_TRUSTED_ORIGINS = [o.strip() for o in _csrf_origins.split(",") if o.strip()]
_render_url = os.environ.get("RENDER_EXTERNAL_URL", "").strip()
if _render_url:
    parsed = urlparse(_render_url)
    if parsed.scheme and parsed.netloc:
        _origin = f"{parsed.scheme}://{parsed.netloc}"
        if _origin not in CSRF_TRUSTED_ORIGINS:
            CSRF_TRUSTED_ORIGINS = [*CSRF_TRUSTED_ORIGINS, _origin]

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
