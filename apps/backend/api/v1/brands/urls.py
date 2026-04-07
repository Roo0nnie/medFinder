from django.urls import path

from .views import BrandMineDetailView, BrandMineListView, BrandSearchListView

urlpatterns = [
    path("", BrandSearchListView.as_view(), name="brand-search-list"),
    path("mine/", BrandMineListView.as_view(), name="brand-mine-list"),
    path("mine/<str:brand_id>/", BrandMineDetailView.as_view(), name="brand-mine-detail"),
]
