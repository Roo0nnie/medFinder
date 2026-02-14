"""
V1 API URLconf. Health and example/todos.
"""
from django.urls import path, include

urlpatterns = [
    path("health/", include("api.v1.health.urls")),
    path("example/", include("api.v1.examples.todos.urls")),
    path("users/", include("api.v1.users.urls")),
]
