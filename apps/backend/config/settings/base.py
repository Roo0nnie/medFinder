"""
Django base settings.
"""
import os

# Build paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

SECRET_KEY = os.environ.get("SECRET_KEY", "change-me-in-production")

DEBUG = os.environ.get("DEBUG", "true").lower() in ("1", "true", "yes")

ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "api.v1.health",
    "api.v1.examples.todos",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("PGDATABASE", "turbo_template"),
        "USER": os.environ.get("PGUSER", "postgres"),
        "PASSWORD": os.environ.get("PGPASSWORD", ""),
        "HOST": os.environ.get("PGHOST", "localhost"),
        "PORT": os.environ.get("PGPORT", "5432"),
    }
}

# Parse DATABASE_URL if set (overrides individual vars)
_db_url = os.environ.get("DATABASE_URL")
if _db_url:
    import re
    _m = re.match(r"postgres(?:ql)?://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)", _db_url)
    if _m:
        DATABASES["default"].update({
            "USER": _m.group(1),
            "PASSWORD": _m.group(2),
            "HOST": _m.group(3),
            "PORT": _m.group(4),
            "NAME": _m.group(5),
        })

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# CORS - allow list from env
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("CORS_ORIGINS", "http://localhost:3001").split(",")
    if origin.strip()
]
CORS_ALLOW_CREDENTIALS = True

# DRF
REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
    "EXCEPTION_HANDLER": "core.exceptions.api_exception_handler",
}
