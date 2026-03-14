"""
Reservation API views.
"""
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.v1.inventory.models import PharmacyInventory
from api.v1.pharmacies.models import PharmacyStaff
from api.v1.staff.models import Staff

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

        # Customers can only see their own reservations unless admin/owner/staff.
        if (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == "customer"
            and customer_id
            and str(customer_id) != str(request.user.id)
        ):
            return Response(
                {"detail": "You do not have permission to view other customers' reservations."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == "customer"
            and not customer_id
        ):
            customer_id = str(request.user.id)

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

        if getattr(request.user, "role", None) != "customer":
            return Response(
                {"detail": "Only customers can create reservations."},
                status=status.HTTP_403_FORBIDDEN,
            )

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
            reservation = services.get_reservation_by_id(pk)
        except ProductReservation.DoesNotExist:
            return Response(
                {"detail": "Reservation not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not _can_modify_reservation(request.user, reservation):
            return Response(
                {"detail": "You do not have permission to update this reservation."},
                status=status.HTTP_403_FORBIDDEN,
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
            reservation = services.get_reservation_by_id(pk)
        except ProductReservation.DoesNotExist:
            return Response(
                {"detail": "Reservation not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not _can_modify_reservation(request.user, reservation):
            return Response(
                {"detail": "You do not have permission to cancel this reservation."},
                status=status.HTTP_403_FORBIDDEN,
            )

        result = services.cancel_reservation(pk)
        return Response(result)


def _can_modify_reservation(user, reservation: ProductReservation) -> bool:
    if not user or not user.is_authenticated:
        return False
    role = getattr(user, "role", None)
    if role == "admin":
        return True
    if role == "customer":
        return str(reservation.customer_id) == str(user.id)

    # Owner/staff: verify reservation is for a pharmacy they own/are assigned to.
    try:
        inventory = PharmacyInventory.objects.get(pk=reservation.inventory_id)
    except PharmacyInventory.DoesNotExist:
        return False

    if role == "owner":
        # inventory.pharmacy_id -> pharmacy.owner_id
        try:
            from api.v1.pharmacies.models import Pharmacy

            pharmacy = Pharmacy.objects.get(pk=inventory.pharmacy_id)
        except Exception:
            return False
        return str(pharmacy.owner_id) == str(user.id)

    if role == "staff":
        try:
            staff_profile = Staff.objects.get(user_id=str(user.id))
        except Staff.DoesNotExist:
            return False
        return PharmacyStaff.objects.filter(
            pharmacy_id=str(inventory.pharmacy_id), staff_id=str(staff_profile.id)
        ).exists()

    return False

