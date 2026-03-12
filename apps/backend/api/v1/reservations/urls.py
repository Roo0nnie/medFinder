from django.urls import path

from .views import ReservationDetailView, ReservationListCreateView


urlpatterns = [
    path("", ReservationListCreateView.as_view(), name="reservation-list-create"),
    path("<str:pk>/", ReservationDetailView.as_view(), name="reservation-detail"),
]


