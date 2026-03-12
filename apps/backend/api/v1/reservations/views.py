"""
Reservation API views.
"""
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import services
from .models import ProductReservation
from .serializers import (
    CreateReservationInputSerializer,
    ProductReservationSerializer,
    UpdateReservationInputSerializer,
)


class ReservationListCreateView(APIView):
    """
    GET list reservations, POST create a new reservation.
    """

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated()]
        return [AllowAny()]

    def get(self, request):
        customer_id = request.query_params.get("customerId")
        inventory_id = request.query_params.get("inventoryId")
        status_param = request.query_params.get("status")

        reservations = services.list_reservations(
            customer_id=customer_id,
            inventory_id=inventory_id,
            status=status_param,
        )
        serializer = ProductReservationSerializer(reservations, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = CreateReservationInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        reservation = services.create_reservation(
            customer_id=str(request.user.id),
            inventory_id=data["inventoryId"],
            quantity=data["quantity"],
        )

        out_serializer = ProductReservationSerializer(reservation)
        return Response(out_serializer.data, status=status.HTTP_201_CREATED)


class ReservationDetailView(APIView):
    """
    GET, PUT, DELETE reservation by id.
    """

    def get_permissions(self):
        if self.request.method in ("PUT", "DELETE"):
            return [IsAuthenticated()]
        return [AllowAny()]

    def get(self, request, pk):
        try:
            reservation = services.get_reservation_by_id(pk)
        except ProductReservation.DoesNotExist:
            return Response(
                {"detail": "Reservation not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ProductReservationSerializer(reservation)
        return Response(serializer.data)

    def put(self, request, pk):
        try:
            services.get_reservation_by_id(pk)
        except ProductReservation.DoesNotExist:
            return Response(
                {"detail": "Reservation not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = UpdateReservationInputSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        reservation = services.update_reservation(
            pk,
            quantity=data.get("quantity"),
            status=data.get("status"),
        )

        out_serializer = ProductReservationSerializer(reservation)
        return Response(out_serializer.data)

    def delete(self, request, pk):
        try:
            services.get_reservation_by_id(pk)
        except ProductReservation.DoesNotExist:
            return Response(
                {"detail": "Reservation not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        result = services.cancel_reservation(pk)
        return Response(result)


