#!/usr/bin/env sh
set -e
PORT="${PORT:-3000}"
python manage.py collectstatic --noinput
python manage.py migrate --noinput
exec gunicorn config.wsgi:application --bind "0.0.0.0:${PORT}" "$@"
