"""
Product business logic and read-only operations.
"""
from typing import Iterable, Optional

from django.db.models import QuerySet

from .models import MedicalProduct, ProductCategory


def list_products(
    *,
    query: Optional[str] = None,
    category_id: Optional[str] = None,
    requires_prescription: Optional[bool] = None,
    manufacturer: Optional[str] = None,
) -> QuerySet[MedicalProduct]:
    qs = MedicalProduct.objects.all()

    if category_id:
        qs = qs.filter(category_id=category_id)

    if requires_prescription is not None:
        qs = qs.filter(requires_prescription=requires_prescription)

    if manufacturer:
        qs = qs.filter(manufacturer__icontains=manufacturer)

    if query:
        query = query.strip()
        qs = qs.filter(name__icontains=query)

    return qs.order_by("name")


def get_product_by_id(product_id: str) -> MedicalProduct:
    return MedicalProduct.objects.get(pk=product_id)


def list_categories() -> Iterable[ProductCategory]:
    return ProductCategory.objects.all().order_by("name")


