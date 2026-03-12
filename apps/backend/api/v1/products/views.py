"""
Product API views.
Currently read-only wrappers around shared product tables.
"""
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from . import services
from .models import MedicalProduct
from .serializers import MedicalProductSerializer


class ProductListView(APIView):
    """
    GET list/search products.
    Public read with optional filters.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        query = request.query_params.get("query")
        category_id = request.query_params.get("categoryId")
        requires_prescription_param = request.query_params.get("requiresPrescription")
        manufacturer = request.query_params.get("manufacturer")

        requires_prescription = None
        if requires_prescription_param is not None:
            requires_prescription = requires_prescription_param.lower() == "true"

        products = services.list_products(
            query=query,
            category_id=category_id,
            requires_prescription=requires_prescription,
            manufacturer=manufacturer,
        )
        serializer = MedicalProductSerializer(products, many=True)
        return Response(serializer.data)


class ProductDetailView(APIView):
    """
    GET single product by id.
    """

    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            product = services.get_product_by_id(pk)
        except MedicalProduct.DoesNotExist:
            return Response(
                {"detail": "Product not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = MedicalProductSerializer(product)
        return Response(serializer.data)


