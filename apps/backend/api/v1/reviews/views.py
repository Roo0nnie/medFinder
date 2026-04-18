"""
Review API views.
"""
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.v1.analytics.audit_helpers import audit_actor_from_request, owner_id_from_pharmacy_id, owner_id_from_product_id, safe_log_audit_event
from api.v1.pharmacies.models import Pharmacy, PharmacyStaff
from api.v1.staff.models import Staff
from api.v1.users.models import User

from . import services
from .models import PharmacyReview, ProductReview
from .serializers import (
    CreatePharmacyReviewInputSerializer,
    CreateProductReviewInputSerializer,
    PharmacyReviewSerializer,
    ProductReviewSerializer,
)


class PharmacyReviewListCreateView(APIView):
    """
    GET list pharmacy reviews, POST create a new pharmacy review.
    """

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated()]
        return [AllowAny()]

    def get(self, request):
        pharmacy_id = request.query_params.get("pharmacyId") or None
        if pharmacy_id == "":
            pharmacy_id = None
        user_id = request.query_params.get("userId")
        rating_param = request.query_params.get("rating")
        rating: int | None = None

        if rating_param:
            try:
                rating = int(rating_param)
            except (TypeError, ValueError):
                rating = None

        # When no pharmacy is specified, only owner/staff can list (reviews for their pharmacies)
        if pharmacy_id is None:
            if not (request.user and request.user.is_authenticated):
                return Response(
                    {"detail": "Authentication required to list all reviews for your pharmacies."},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
            if getattr(request.user, "role", None) not in ("owner", "staff", "admin"):
                return Response(
                    {"detail": "Only owners and staff can list reviews across their pharmacies."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        if request.user and request.user.is_authenticated and getattr(request.user, "role", None) in ("owner", "staff", "admin"):
            allowed = set(_pharmacy_ids_for_user(request.user))
            if pharmacy_id and pharmacy_id not in allowed:
                return Response(
                    {"detail": "You do not have permission to view reviews for this pharmacy."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            if not pharmacy_id:
                pharmacy_id = None  # filter by allowed below

        reviews = services.list_pharmacy_reviews(
            pharmacy_id=pharmacy_id,
            user_id=user_id,
            rating=rating,
        )
        if request.user and request.user.is_authenticated and getattr(request.user, "role", None) in ("owner", "staff", "admin"):
            allowed = list(_pharmacy_ids_for_user(request.user))
            reviews = reviews.filter(pharmacy_id__in=allowed)
        user_ids = list(reviews.values_list("user_id", flat=True))
        pharmacy_ids = list(reviews.values_list("pharmacy_id", flat=True))
        users = User.objects.filter(id__in=user_ids)
        pharmacies = Pharmacy.objects.filter(id__in=pharmacy_ids)
        users_by_id = {str(u.id): u for u in users}
        pharmacies_by_id = {str(p.id): p for p in pharmacies}
        serializer = PharmacyReviewSerializer(
            reviews, many=True, context={"users_by_id": users_by_id, "pharmacies_by_id": pharmacies_by_id}
        )
        return Response(serializer.data)

    def post(self, request):
        serializer = CreatePharmacyReviewInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        review = services.create_pharmacy_review(
            pharmacy_id=data["pharmacyId"],
            user_id=str(request.user.id),
            rating=data["rating"],
            comment=data.get("comment"),
        )

        oid = owner_id_from_pharmacy_id(data["pharmacyId"])
        if oid:
            actor_uid, _ = audit_actor_from_request(request)
            safe_log_audit_event(
                owner_id=oid,
                actor_user_id=actor_uid,
                actor_role="customer",
                action="CREATE",
                resource_type="PharmacyReview",
                resource_id=review.id,
                details=f"rating={data['rating']}",
            )

        out_serializer = PharmacyReviewSerializer(review)
        return Response(out_serializer.data, status=status.HTTP_201_CREATED)


class PharmacyReviewDetailView(APIView):
    """
    GET a single pharmacy review by id.
    DELETE allow admin or owner of the pharmacy.
    """

    def get_permissions(self):
        if self.request.method == "DELETE":
            return [IsAuthenticated()]
        return [AllowAny()]

    def get(self, request, pk):
        try:
            review = services.get_pharmacy_review_by_id(pk)
        except PharmacyReview.DoesNotExist:
            return Response(
                {"detail": "Review not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = PharmacyReviewSerializer(review)
        return Response(serializer.data)

    def delete(self, request, pk):
        try:
            review = services.get_pharmacy_review_by_id(pk)
        except PharmacyReview.DoesNotExist:
            return Response(
                {"detail": "Review not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        role = getattr(request.user, "role", None)
        oid = owner_id_from_pharmacy_id(review.pharmacy_id)
        rid = review.id
        actor_uid, actor_role = audit_actor_from_request(request)
        if role == "admin":
            review.delete()
            if oid:
                safe_log_audit_event(
                    owner_id=oid,
                    actor_user_id=actor_uid,
                    actor_role=actor_role,
                    action="DELETE",
                    resource_type="PharmacyReview",
                    resource_id=str(rid),
                    details="moderation",
                )
            return Response({"success": True, "id": pk})

        # Owner can delete reviews on their pharmacy
        if role == "owner":
            try:
                pharmacy = Pharmacy.objects.get(pk=review.pharmacy_id)
            except Pharmacy.DoesNotExist:
                return Response(
                    {"detail": "You do not have permission to delete this review."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            if str(pharmacy.owner_id) != str(request.user.id):
                return Response(
                    {"detail": "You do not have permission to delete this review."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            review.delete()
            if oid:
                safe_log_audit_event(
                    owner_id=oid,
                    actor_user_id=actor_uid,
                    actor_role=actor_role,
                    action="DELETE",
                    resource_type="PharmacyReview",
                    resource_id=str(rid),
                    details="moderation",
                )
            return Response({"success": True, "id": pk})

        return Response(
            {"detail": "You do not have permission to delete this review."},
            status=status.HTTP_403_FORBIDDEN,
        )


class ProductReviewListCreateView(APIView):
    """
    GET list product reviews, POST create a new product review.
    """

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated()]
        return [AllowAny()]

    def get(self, request):
        product_id = request.query_params.get("productId")
        user_id = request.query_params.get("userId")

        reviews = services.list_product_reviews(
            product_id=product_id,
            user_id=user_id,
        )
        serializer = ProductReviewSerializer(reviews, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = CreateProductReviewInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        review = services.create_product_review(
            product_id=data["productId"],
            user_id=str(request.user.id),
            rating=data["rating"],
            comment=data.get("comment"),
        )

        oid = owner_id_from_product_id(data["productId"])
        if oid:
            actor_uid, _ = audit_actor_from_request(request)
            safe_log_audit_event(
                owner_id=oid,
                actor_user_id=actor_uid,
                actor_role="customer",
                action="CREATE",
                resource_type="ProductReview",
                resource_id=review.id,
                details=f"rating={data['rating']} product={data['productId']}",
            )

        out_serializer = ProductReviewSerializer(review)
        return Response(out_serializer.data, status=status.HTTP_201_CREATED)


class ProductReviewDetailView(APIView):
    """
    GET a single product review by id.
    DELETE allow admin only.
    """

    def get_permissions(self):
        if self.request.method == "DELETE":
            return [IsAuthenticated()]
        return [AllowAny()]

    def get(self, request, pk):
        try:
            review = services.get_product_review_by_id(pk)
        except ProductReview.DoesNotExist:
            return Response(
                {"detail": "Review not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ProductReviewSerializer(review)
        return Response(serializer.data)

    def delete(self, request, pk):
        try:
            review = services.get_product_review_by_id(pk)
        except ProductReview.DoesNotExist:
            return Response(
                {"detail": "Review not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if getattr(request.user, "role", None) != "admin":
            return Response(
                {"detail": "Only admins can delete product reviews."},
                status=status.HTTP_403_FORBIDDEN,
            )

        oid = owner_id_from_product_id(review.product_id)
        rid = review.id
        pid = review.product_id
        actor_uid, actor_role = audit_actor_from_request(request)
        review.delete()
        if oid:
            safe_log_audit_event(
                owner_id=oid,
                actor_user_id=actor_uid,
                actor_role=actor_role,
                action="DELETE",
                resource_type="ProductReview",
                resource_id=str(rid),
                details=f"product={pid}",
            )
        return Response({"success": True, "id": pk})


def _pharmacy_ids_for_user(user):
    if getattr(user, "role", None) == "admin":
        return Pharmacy.objects.values_list("id", flat=True)

    if getattr(user, "role", None) == "owner":
        return Pharmacy.objects.filter(owner_id=str(user.id)).values_list("id", flat=True)

    if getattr(user, "role", None) == "staff":
        try:
            staff_profile = Staff.objects.get(user_id=str(user.id))
        except Staff.DoesNotExist:
            return []
        return PharmacyStaff.objects.filter(staff_id=staff_profile.id).values_list("pharmacy_id", flat=True)

    return []
