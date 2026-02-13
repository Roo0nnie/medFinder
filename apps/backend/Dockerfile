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
USER appuser

COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --chown=appuser:appgroup . .

ENV DJANGO_SETTINGS_MODULE=config.settings.production
ENV PYTHONUNBUFFERED=1

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health/ || exit 1
RUN chmod +x /app/entrypoint.sh
ENTRYPOINT ["/app/entrypoint.sh"]
CMD []
