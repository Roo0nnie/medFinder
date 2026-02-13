#!/usr/bin/env sh
set -e
python manage.py migrate --noinput
exec gunicorn config.wsgi:application --bind 0.0.0.0:3000 "$@"
