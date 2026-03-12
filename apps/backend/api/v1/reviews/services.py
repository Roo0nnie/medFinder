"""
Review business logic and CRUD operations.
"""
import uuid
from typing import Optional

from django.db.models import QuerySet
from django.utils import timezone

from .models import PharmacyReview, ProductReview


def list_pharmacy_reviews(
    *,
    pharmacy_id: Optional[str] = None,
    user_id: Optional[str] = None,
) -> QuerySet[PharmacyReview]:
    qs = PharmacyReview.objects.all()

    if pharmacy_id:
        qs = qs.filter(pharmacy_id=pharmacy_id)

    if user_id:
        qs = qs.filter(user_id=user_id)

    return qs.order_by("-created_at")


def list_product_reviews(
    *,
    product_id: Optional[str] = None,
    user_id: Optional[str] = None,
) -> QuerySet[ProductReview]:
    qs = ProductReview.objects.all()

    if product_id:
        qs = qs.filter(product_id=product_id)

    if user_id:
        qs = qs.filter(user_id=user_id)

    return qs.order_by("-created_at")


def get_pharmacy_review_by_id(review_id: str) -> PharmacyReview:
    return PharmacyReview.objects.get(pk=review_id)


def get_product_review_by_id(review_id: str) -> ProductReview:
    return ProductReview.objects.get(pk=review_id)


def create_pharmacy_review(
    *,
    pharmacy_id: str,
    user_id: str,
    rating: int,
    comment: Optional[str] = None,
) -> PharmacyReview:
    now = timezone.now()
    review_id = str(uuid.uuid4())
    return PharmacyReview.objects.create(
        id=review_id,
        pharmacy_id=pharmacy_id,
        user_id=user_id,
        rating=rating,
        comment=comment or "",
        created_at=now,
        updated_at=now,
    )


def create_product_review(
    *,
    product_id: str,
    user_id: str,
    rating: int,
    comment: Optional[str] = None,
) -> ProductReview:
    now = timezone.now()
    review_id = str(uuid.uuid4())
    return ProductReview.objects.create(
        id=review_id,
        product_id=product_id,
        user_id=user_id,
        rating=rating,
        comment=comment or "",
        created_at=now,
        updated_at=now,
    )


