"""
Inventory API views.
Provides CRUD with owner/admin/staff scoping.
"""
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.v1.analytics.audit_helpers import audit_actor_from_request, owner_id_from_pharmacy_id, safe_log_audit_event
from api.v1.pharmacies.models import Pharmacy, PharmacyStaff
from api.v1.staff.models import Staff

from . import services
from .models import PharmacyInventory
from .serializers import (
    PharmacyInventoryCreateSerializer,
    PharmacyInventorySerializer,
    PharmacyInventoryUpdateSerializer,
)


class InventoryListView(APIView):
    """
    GET list/search inventory records.
    POST create inventory (owner/admin/staff with assignment).
    """

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated()]
        return [AllowAny()]

    def get(self, request):
        pharmacy_id = request.query_params.get("pharmacyId")
        product_id = request.query_params.get("productId")
        is_available_param = request.query_params.get("isAvailable")

        is_available = None
        if is_available_param is not None:
            is_available = is_available_param.lower() != "false"

        # Owner/staff: scope to their pharmacies. Staff use same scope as Products (all owner's pharmacies).
        allowed_pharmacies = None
        if request.user and request.user.is_authenticated:
            role = getattr(request.user, "role", None)
            if role == "owner":
                allowed_pharmacies = _pharmacy_ids_for_user(request.user)
            elif role == "staff":
                allowed_pharmacies = _pharmacy_ids_for_staff_list(request.user)

        inventory = services.list_inventory(
            pharmacy_id=pharmacy_id,
            product_id=product_id,
            is_available=is_available,
        )
        if not request.user or not request.user.is_authenticated:
            inventory = inventory.filter(
                pharmacy_id__in=Pharmacy.objects.filter(
                    is_active=True, certificate_status="approved"
                ).values_list("id", flat=True)
            )
        elif getattr(request.user, "role", None) not in ("admin", "owner", "staff"):
            inventory = inventory.filter(
                pharmacy_id__in=Pharmacy.objects.filter(
                    is_active=True, certificate_status="approved"
                ).values_list("id", flat=True)
            )
        if allowed_pharmacies is not None:
            inventory = inventory.filter(pharmacy_id__in=allowed_pharmacies)
        serializer = PharmacyInventorySerializer(inventory, many=True)
        return Response(serializer.data)

    def post(self, request):
        in_serializer = PharmacyInventoryCreateSerializer(data=request.data)
        in_serializer.is_valid(raise_exception=True)
        data = in_serializer.validated_data

        # Permission: owner/admin or assigned staff for the pharmacy.
        if not _can_modify_inventory(request.user, data["pharmacyId"]):
            return Response(
                {"detail": "You do not have permission to create inventory for this pharmacy."},
                status=status.HTTP_403_FORBIDDEN,
            )

        record = services.create_inventory(
            pharmacy_id=data["pharmacyId"],
            product_id=data["productId"],
            quantity=data["quantity"],
            price=data["price"],
            variant_id=data.get("variantId"),
            discount_price=data.get("discountPrice"),
            expiry_date=data.get("expiryDate"),
            batch_number=data.get("batchNumber"),
            is_available=data.get("isAvailable", True),
            last_restocked=data.get("lastRestocked"),
        )

        oid = owner_id_from_pharmacy_id(data["pharmacyId"])
        if oid:
            actor_uid, actor_role = audit_actor_from_request(request)
            safe_log_audit_event(
                owner_id=oid,
                actor_user_id=actor_uid,
                actor_role=actor_role,
                action="CREATE",
                resource_type="PharmacyInventory",
                resource_id=record.id,
                details=f"product={record.product_id}",
            )

        out_serializer = PharmacyInventorySerializer(record)
        return Response(out_serializer.data, status=status.HTTP_201_CREATED)


class InventoryDetailView(APIView):
    """
    GET single inventory record by id.
    PUT/PATCH update, DELETE remove (owner/admin/staff scoped).
    """

    def get_permissions(self):
        if self.request.method in ("PUT", "PATCH", "DELETE"):
            return [IsAuthenticated()]
        return [AllowAny()]

    def get(self, request, pk):
        try:
            record = services.get_inventory_by_id(pk)
        except PharmacyInventory.DoesNotExist:
            return Response(
                {"detail": "Inventory not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = PharmacyInventorySerializer(record)
        return Response(serializer.data)

    def put(self, request, pk):
        try:
            record = services.get_inventory_by_id(pk)
        except PharmacyInventory.DoesNotExist:
            return Response(
                {"detail": "Inventory not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        prev_quantity = int(getattr(record, "quantity", 0) or 0)
        prev_price = str(getattr(record, "price", "") or "")
        prev_is_available = bool(getattr(record, "is_available", True))

        if not _can_modify_inventory(request.user, record.pharmacy_id):
            return Response(
                {"detail": "You do not have permission to update this inventory record."},
                status=status.HTTP_403_FORBIDDEN,
            )

        in_serializer = PharmacyInventoryUpdateSerializer(data=request.data, partial=True)
        in_serializer.is_valid(raise_exception=True)
        data = in_serializer.validated_data

        record = services.update_inventory(
            pk,
            variant_id=data.get("variantId"),
            quantity=data.get("quantity"),
            price=data.get("price"),
            discount_price=data.get("discountPrice"),
            expiry_date=data.get("expiryDate"),
            batch_number=data.get("batchNumber"),
            is_available=data.get("isAvailable"),
            last_restocked=data.get("lastRestocked"),
        )

        oid = owner_id_from_pharmacy_id(record.pharmacy_id)
        if oid:
            actor_uid, actor_role = audit_actor_from_request(request)
            changes = []
            new_quantity = int(getattr(record, "quantity", 0) or 0)
            new_price = str(getattr(record, "price", "") or "")
            new_is_available = bool(getattr(record, "is_available", True))
            if new_quantity != prev_quantity:
                changes.append(f"quantity {prev_quantity}->{new_quantity}")
            if new_price != prev_price:
                changes.append(f"price {prev_price}->{new_price}")
            if new_is_available != prev_is_available:
                changes.append(f"isAvailable {str(prev_is_available).lower()}->{str(new_is_available).lower()}")
            details = f"product={record.product_id}"
            if changes:
                details = f"{details} " + ", ".join(changes)
            safe_log_audit_event(
                owner_id=oid,
                actor_user_id=actor_uid,
                actor_role=actor_role,
                action="UPDATE",
                resource_type="PharmacyInventory",
                resource_id=record.id,
                details=details,
            )

        out_serializer = PharmacyInventorySerializer(record)
        return Response(out_serializer.data)

    def delete(self, request, pk):
        try:
            record = services.get_inventory_by_id(pk)
        except PharmacyInventory.DoesNotExist:
            return Response(
                {"detail": "Inventory not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not _can_modify_inventory(request.user, record.pharmacy_id):
            return Response(
                {"detail": "You do not have permission to delete this inventory record."},
                status=status.HTTP_403_FORBIDDEN,
            )

        oid = owner_id_from_pharmacy_id(record.pharmacy_id)
        iid = record.id
        pid = record.product_id
        actor_uid, actor_role = audit_actor_from_request(request)
        result = services.delete_inventory(pk)
        if oid:
            safe_log_audit_event(
                owner_id=oid,
                actor_user_id=actor_uid,
                actor_role=actor_role,
                action="DELETE",
                resource_type="PharmacyInventory",
                resource_id=iid,
                details=f"product={pid}",
            )
        return Response(result)


def _can_modify_inventory(user, pharmacy_id: str) -> bool:
    """
    Owner: pharmacy.owner_id == user.id
    Admin: always true
    Staff: must be assigned to the pharmacy via pharmacy_staff
    """
    if not user or not user.is_authenticated:
        return False
    if getattr(user, "role", None) == "admin":
        return True
    try:
        pharmacy = Pharmacy.objects.get(pk=pharmacy_id)
    except Pharmacy.DoesNotExist:
        return False

    if getattr(user, "role", None) == "owner" and str(pharmacy.owner_id) == str(user.id):
        return True

    if getattr(user, "role", None) == "staff":
        try:
            staff_profile = Staff.objects.get(user_id=str(user.id))
        except Staff.DoesNotExist:
            return False
        # Staff can modify inventory for any pharmacy belonging to their owner (same scope as list).
        return str(pharmacy.owner_id) == str(staff_profile.owner_id)

    return False


def _pharmacy_ids_for_staff_list(user):
    """Pharmacy IDs for staff when listing inventory: all pharmacies of the staff's owner (matches Products)."""
    if getattr(user, "role", None) != "staff":
        return []
    try:
        staff_profile = Staff.objects.get(user_id=str(user.id))
    except Staff.DoesNotExist:
        return []
    return Pharmacy.objects.filter(owner_id=staff_profile.owner_id).values_list("id", flat=True)


def _pharmacy_ids_for_user(user):
    from api.v1.pharmacies.models import Pharmacy, PharmacyStaff
    from api.v1.staff.models import Staff

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
