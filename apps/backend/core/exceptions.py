"""
Custom API exception handler for consistent JSON error responses.
Returns a stable { error, meta } shape (no NestJS/Reflector; this is Django-only).
"""
from datetime import datetime, timezone
from rest_framework.views import exception_handler
from rest_framework.response import Response
from django.conf import settings


def _error_payload(code: str, message: str, status: int, request=None):
    """Build error + meta payload. Used by DRF exception handler and 500 fallback."""
    meta = {
        "traceId": request.path if request else "/",
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z",
    }
    return {"error": {"code": code, "message": message}, "meta": meta}


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        # Optionally normalize DRF responses to error+meta shape here if desired.
        # For now we only normalize unhandled 500s so clients get a consistent format.
        return response
    request = context.get("request")
    message = str(exc)
    if not getattr(settings, "DEBUG", False):
        message = "Internal server error"
    payload = _error_payload("INTERNAL_SERVER_ERROR", message, 500, request)
    return Response(payload, status=500)
