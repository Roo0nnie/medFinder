"""
Health check view. GET /api/v1/health/
"""
import time
from django.db import connection
from django.http import JsonResponse
from django.views import View


class HealthCheckView(View):
    """Anonymous health check. Returns status, timestamp, uptime, version, environment, checks."""

    def get(self, request):
        start = getattr(HealthCheckView, "_start", None)
        if start is None:
            HealthCheckView._start = time.time()
            start = HealthCheckView._start
        uptime = round(time.time() - start, 3)
        status = "ok"
        db_check = {"status": "up"}
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
        except Exception as e:
            db_check = {"status": "down", "message": str(e)}
            status = "error"

        return JsonResponse({
            "status": status,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime()),
            "uptime": uptime,
            "version": "0.0.1",
            "environment": "development",
            "checks": {"database": db_check},
        })
