"""
V1 API URLconf. Health, example/todos, users, and staff.
"""
from django.urls import path, include

urlpatterns = [
    path("health/", include("api.v1.health.urls")),
    path("example/", include("api.v1.examples.todos.urls")),
    path("users/", include("api.v1.users.urls")),
    path("staff/", include("api.v1.staff.urls")),
]
