"""
Root and non-API views. Keeps '/' under Django so you don't hit another server by mistake.
"""
from django.conf import settings
from django.http import JsonResponse


def root_view(request):
    """GET / returns API info. Ensures localhost:8000/ is served by Django, not another process."""
    if request.method != "GET":
        return JsonResponse(
            {"error": {"code": "METHOD_NOT_ALLOWED", "message": "Method not allowed"}},
            status=405,
        )
    return JsonResponse(
        {
            "message": "MedFinder API",
            "api": "/api/v1/",
            "health": "/api/v1/health/",
        }
    )
