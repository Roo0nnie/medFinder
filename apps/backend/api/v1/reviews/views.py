"""
Review API views.
"""
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

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
        pharmacy_id = request.query_params.get("pharmacyId")
        user_id = request.query_params.get("userId")

        reviews = services.list_pharmacy_reviews(
            pharmacy_id=pharmacy_id,
            user_id=user_id,
        )
        serializer = PharmacyReviewSerializer(reviews, many=True)
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

        out_serializer = PharmacyReviewSerializer(review)
        return Response(out_serializer.data, status=status.HTTP_201_CREATED)


class PharmacyReviewDetailView(APIView):
    """
    GET a single pharmacy review by id.
    """

    permission_classes = [AllowAny]

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

        out_serializer = ProductReviewSerializer(review)
        return Response(out_serializer.data, status=status.HTTP_201_CREATED)


class ProductReviewDetailView(APIView):
    """
    GET a single product review by id.
    """

    permission_classes = [AllowAny]

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


