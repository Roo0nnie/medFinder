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
