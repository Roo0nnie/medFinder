# ========================================
# Base Stage
# ========================================
FROM python:3.12-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    wget \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ========================================
# Builder Stage - install dependencies
# ========================================
FROM base AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ========================================
# Runner Stage - production image
# ========================================
FROM base AS runner
RUN addgroup --system --gid 1001 appgroup \
    && adduser --system --uid 1001 --ingroup appgroup appuser

COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --chown=appuser:appgroup . .

# WORKDIR /app is root-owned; collectstatic and MEDIA_ROOT need writes under /app
RUN mkdir -p /app/staticfiles /app/media \
    && chown -R appuser:appgroup /app \
    && chmod +x /app/entrypoint.sh

USER appuser

ENV DJANGO_SETTINGS_MODULE=config.settings.production
ENV PYTHONUNBUFFERED=1

EXPOSE 10000
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD sh -c 'wget --no-verbose --tries=1 --spider "http://127.0.0.1:${PORT:-10000}/api/v1/health/" || exit 1'
ENTRYPOINT ["/app/entrypoint.sh"]
CMD []
