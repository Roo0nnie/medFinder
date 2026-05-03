#!/usr/bin/env sh
set -e
# Render forwards to the port in $PORT (default 10000 if unset). See:
# https://render.com/docs/web-services#port-binding
PORT="${PORT:-10000}"
python manage.py collectstatic --noinput
python manage.py migrate --noinput
# Console scripts live in /usr/local/bin; this image only copies site-packages, so use -m.
exec python -m gunicorn config.wsgi:application --bind "0.0.0.0:${PORT}" "$@"
