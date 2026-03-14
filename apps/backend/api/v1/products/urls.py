from django.urls import path

from .views import (
    ProductCategoryDetailView,
    ProductCategoryListView,
    ProductDetailView,
    ProductListView,
    ProductManageDetailView,
    ProductManageView,
    ProductVariantDetailView,
    ProductVariantsListView,
)

urlpatterns = [
    path("", ProductListView.as_view(), name="product-list"),
    path("categories/", ProductCategoryListView.as_view(), name="product-category-list"),
    path("categories/<str:pk>/", ProductCategoryDetailView.as_view(), name="product-category-detail"),
    path("manage/", ProductManageView.as_view(), name="product-create"),
    path("manage/<str:pk>/", ProductManageDetailView.as_view(), name="product-manage-detail"),
    path("<str:pk>/variants/", ProductVariantsListView.as_view(), name="product-variants-list"),
    path("<str:pk>/variants/<str:variant_pk>/", ProductVariantDetailView.as_view(), name="product-variant-detail"),
    path("<str:pk>/", ProductDetailView.as_view(), name="product-detail"),
]
