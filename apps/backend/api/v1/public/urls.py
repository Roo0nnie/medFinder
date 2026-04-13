from django.urls import path

from .views import LandingStatsView


urlpatterns = [
    path("landing-stats/", LandingStatsView.as_view(), name="public-landing-stats"),
]

