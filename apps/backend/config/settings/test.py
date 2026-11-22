"""
Test settings.

Usage:
    python manage.py test --settings=config.settings.test

The database comes ONLY from TEST_DATABASE_URL (never DATABASE_URL, which in a
developer .env may point at a hosted database). Django creates and destroys a
separate ``test_<name>`` database on that server.
"""
import os
from urllib.parse import urlparse

import dj_database_url

from .base import *  # noqa: F401,F403

_ALLOWED_TEST_DB_HOSTS = {"localhost", "127.0.0.1", "postgres"}

_test_db_url = os.environ.get(
    "TEST_DATABASE_URL", "postgres://postgres:postgres@localhost:5432/medfinder"
)
_host = urlparse(_test_db_url).hostname or ""
if _host not in _ALLOWED_TEST_DB_HOSTS:
    raise RuntimeError(
        f"Refusing to run tests against non-local database host {_host!r}. "
        f"Set TEST_DATABASE_URL to a local PostgreSQL ({', '.join(sorted(_ALLOWED_TEST_DB_HOSTS))})."
    )

DATABASES = {"default": dj_database_url.parse(_test_db_url)}

TEST_RUNNER = "core.test_runner.UnmanagedModelTestRunner"

DEBUG = False

CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}

PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]

MEDIA_ROOT = os.path.join(BASE_DIR, ".test-media")  # noqa: F405
