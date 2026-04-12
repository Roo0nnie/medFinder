"""
Product API views.
"""
from django.core.cache import cache
from django.db import IntegrityError
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from api.v1.inventory import services as inventory_services
from api.v1.inventory.models import PharmacyInventory
from api.v1.pharmacies.models import Pharmacy
from api.v1.staff.models import Staff
from api.v1.users.permissions import IsOwner

from . import services
from .models import MedicalProduct, MedicalProductVariant, ProductCategory

_APPROVED_PHARMACY_IDS_CACHE_KEY = "v1:approved_active_pharmacy_ids"
_APPROVED_PHARMACY_IDS_CACHE_TTL = 60


def _get_cached_approved_pharmacy_ids():
    """Approved, active pharmacy ids for public scopes; short TTL to limit query load."""
    cached = cache.get(_APPROVED_PHARMACY_IDS_CACHE_KEY)
    if cached is not None:
        return cached
    ids = list(
        Pharmacy.objects.filter(is_active=True, certificate_status="approved").values_list("id", flat=True)
    )
    cache.set(_APPROVED_PHARMACY_IDS_CACHE_KEY, ids, _APPROVED_PHARMACY_IDS_CACHE_TTL)
    return ids
from .serializers import (
    MedicalProductCreateSerializer,
    MedicalProductSerializer,
    MedicalProductUpdateSerializer,
    MedicalProductVariantSerializer,
    ProductBrandAvailabilitySerializer,
    ProductCategoryCreateSerializer,
    ProductCategorySerializer,
    ProductCategoryUpdateSerializer,
    ProductPharmacyForBrandSerializer,
    ProductVariantCreateSerializer,
    ProductVariantUpdateSerializer,
)


def _is_public_request(request) -> bool:
    if not request.user or not request.user.is_authenticated:
        return True
    return getattr(request.user, "role", None) not in ("admin", "owner", "staff")


def _pharmacy_ids_scope_for_request(request):
    """
    Inventory/pharmacy visibility for product-finder endpoints.
    None = no extra filter (admin). Empty list = no access.
    """
    if _is_public_request(request):
        return _get_cached_approved_pharmacy_ids()
    user_role = getattr(request.user, "role", None)
    if user_role == "admin" and request.user.is_authenticated:
        return None
    if user_role == "owner" and request.user.is_authenticated:
        return list(_pharmacy_ids_for_user(request.user))
    if user_role == "staff" and request.user.is_authenticated:
        try:
            staff_profile = Staff.objects.get(user_id=str(request.user.id))
            return list(
                Pharmacy.objects.filter(owner_id=staff_profile.owner_id).values_list("id", flat=True)
            )
        except Staff.DoesNotExist:
            return []
    return list(
        Pharmacy.objects.filter(is_active=True, certificate_status="approved").values_list("id", flat=True)
    )


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
        limit_param = request.query_params.get("limit")
        offset_param = request.query_params.get("offset")
        prefix_param = request.query_params.get("prefix")
        search_type = request.query_params.get("searchType") or "plain"

        requires_prescription = None
        if requires_prescription_param is not None:
            requires_prescription = requires_prescription_param.lower() == "true"

        limit = None
        offset = None
        try:
            if limit_param is not None:
                limit = max(0, min(int(limit_param), 100))
            if offset_param is not None:
                offset = max(0, int(offset_param))
        except ValueError:
            return Response(
                {"detail": "limit and offset must be integers"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        prefix = False
        if prefix_param is not None:
            prefix = prefix_param.lower() == "true"

        if search_type not in ("plain", "websearch"):
            return Response(
                {"detail": "searchType must be one of: plain, websearch"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        products = services.list_products(
            query=query,
            category_id=category_id,
            requires_prescription=requires_prescription,
            manufacturer=manufacturer,
            limit=limit,
            offset=offset,
            prefix=prefix,
            search_type=search_type,
        )
        if _is_public_request(request):
            approved_pharmacy_ids = _get_cached_approved_pharmacy_ids()
            products = products.filter(pharmacy_id__in=approved_pharmacy_ids)

        # Owner: only show products for their pharmacies. Staff: show all products of their owner's pharmacies.
        user_role = getattr(request.user, "role", None)
        if user_role == "owner" and request.user.is_authenticated:
            pharmacy_ids = list(_pharmacy_ids_for_user(request.user))
            products = products.filter(pharmacy_id__in=pharmacy_ids)
        elif user_role == "staff" and request.user.is_authenticated:
            try:
                staff_profile = Staff.objects.get(user_id=str(request.user.id))
                pharmacy_ids = list(
                    Pharmacy.objects.filter(owner_id=staff_profile.owner_id).values_list("id", flat=True)
                )
                products = products.filter(pharmacy_id__in=pharmacy_ids)
            except Staff.DoesNotExist:
                products = products.none()
        # Evaluate queryset once so we can log search telemetry with result count.
        product_list = list(products)

        # Log search telemetry for analytics when a query string is provided.
        if query:
            customer_id = None
            if request.user and request.user.is_authenticated:
                customer_id = str(getattr(request.user, "id", None))
            services.log_product_search(
                search_query=query,
                customer_id=customer_id,
                results_count=len(product_list),
            )

        serializer = MedicalProductSerializer(product_list, many=True)
        data = serializer.data

        # Add variants to each product for catalog/landing (id, label, price, quantity, lowStockThreshold)
        if product_list:
            product_ids = [p.id for p in product_list]
            variants_by_product = {}
            for v in MedicalProductVariant.objects.filter(product_id__in=product_ids).order_by("sort_order", "label"):
                variants_by_product.setdefault(v.product_id, []).append(v)
            inv_list = list(
                PharmacyInventory.objects.filter(product_id__in=product_ids, is_available=True).order_by("price")
            )
            # Build per (product_id, variant_id) best price/quantity
            inv_by_pv = {}
            for inv in inv_list:
                vid = getattr(inv, "variant_id", None) or ""
                key = (inv.product_id, vid)
                if key not in inv_by_pv:
                    inv_by_pv[key] = {"price": inv.price, "quantity": inv.quantity}
            low_by_product = {p.id: (p.low_stock_threshold if p.low_stock_threshold is not None else 5) for p in product_list}
            for i, item in enumerate(data):
                pid = product_list[i].id
                low = low_by_product.get(pid, 5)
                vars_out = []
                for v in variants_by_product.get(pid, []):
                    pv = inv_by_pv.get((pid, v.id), inv_by_pv.get((pid, "")))
                    vars_out.append({
                        "id": v.id,
                        "label": v.label,
                        "unit": getattr(v, "unit", None) or "piece",
                        "price": float(pv["price"]) if pv else 0.0,
                        "quantity": pv["quantity"] if pv else 0,
                        "lowStockThreshold": low,
                        "strength": getattr(v, "strength", None) or "",
                        "dosageForm": getattr(v, "dosage_form", None) or "",
                        "imageUrl": getattr(v, "image_url", None) or "",
                        "imageUrls": services.variant_image_urls_for_api(v),
                    })
                item["variants"] = vars_out if vars_out else None

        return Response(data)


class ProductBrandsAcrossPharmaciesView(APIView):
    """
    GET distinct brands for the same generic/name group as the given product, with pharmacy counts.
    """

    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            product = services.get_product_by_id(pk)
        except MedicalProduct.DoesNotExist:
            return Response({"detail": "Product not found"}, status=status.HTTP_404_NOT_FOUND)

        scope = _pharmacy_ids_scope_for_request(request)
        variant_id = request.query_params.get("variantId") or request.query_params.get("variant_id")
        rows = services.list_brands_for_product_group(
            product, pharmacy_ids=scope, variant_id=variant_id
        )
        serializer = ProductBrandAvailabilitySerializer(rows, many=True)
        return Response(serializer.data)


class ProductPharmaciesForBrandView(APIView):
    """
    GET pharmacies that stock a brand within the same generic/name group as the seed product.
    Query: brandId and/or brandName (brandId preferred when present).
    """

    permission_classes = [AllowAny]

    def get(self, request, pk):
        brand_id = request.query_params.get("brandId") or request.query_params.get("brand_id")
        brand_name = request.query_params.get("brandName") or request.query_params.get("brand_name")
        if not (brand_id or "").strip() and not (brand_name or "").strip():
            return Response(
                {"detail": "brandId or brandName is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            product = services.get_product_by_id(pk)
        except MedicalProduct.DoesNotExist:
            return Response({"detail": "Product not found"}, status=status.HTTP_404_NOT_FOUND)

        scope = _pharmacy_ids_scope_for_request(request)
        rows = services.list_pharmacies_for_product_brand(
            product,
            brand_id=brand_id,
            brand_name=brand_name,
            pharmacy_ids=scope,
        )
        serializer = ProductPharmacyForBrandSerializer(rows, many=True)
        return Response(serializer.data)


class ProductDetailView(APIView):
    """
    GET single product by id.
    Returns product with category name, availability (pharmacies with price/quantity), and priceFrom.
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

        if _is_public_request(request):
            if not product.pharmacy_id:
                return Response({"detail": "Product not found"}, status=status.HTTP_404_NOT_FOUND)
            try:
                pharmacy = Pharmacy.objects.get(pk=product.pharmacy_id)
            except Pharmacy.DoesNotExist:
                return Response({"detail": "Product not found"}, status=status.HTTP_404_NOT_FOUND)
            if not pharmacy.is_active or pharmacy.certificate_status != "approved":
                return Response({"detail": "Product not found"}, status=status.HTTP_404_NOT_FOUND)

        data = MedicalProductSerializer(product).data

        # Resolve category name from product_categories
        try:
            category = ProductCategory.objects.get(pk=product.category_id)
            data["category"] = category.name
        except ProductCategory.DoesNotExist:
            data["category"] = None

        # Build availability from pharmacy_inventory + pharmacies (rows without variant = default)
        inventories = list(
            PharmacyInventory.objects.filter(
                product_id=pk,
                is_available=True,
            ).order_by("price")
        )
        pharmacy_ids = [inv.pharmacy_id for inv in inventories]
        pharmacies_qs = Pharmacy.objects.filter(id__in=pharmacy_ids)
        if _is_public_request(request):
            pharmacies_qs = pharmacies_qs.filter(is_active=True, certificate_status="approved")
        pharmacies = {p.id: p for p in pharmacies_qs}

        availability = []
        for inv in inventories:
            ph = pharmacies.get(inv.pharmacy_id)
            if not ph:
                continue
            availability.append({
                "pharmacyId": str(inv.pharmacy_id),
                "pharmacyName": ph.name,
                "address": ph.address or "",
                "city": ph.city or "",
                "price": inv.price,
                "discountPrice": inv.discount_price,
                "quantity": inv.quantity,
                "isAvailable": inv.is_available,
                "variantId": str(inv.variant_id) if getattr(inv, "variant_id", None) else None,
            })
        data["availability"] = availability
        if inventories:
            data["priceFrom"] = min(inv.price for inv in inventories)
        else:
            data["priceFrom"] = None

        # Build variants array: each variant with id, label, and availability (price/quantity per pharmacy)
        from .models import MedicalProductVariant

        variant_rows = list(
            MedicalProductVariant.objects.filter(product_id=pk).order_by("sort_order", "label")
        )
        product_low = product.low_stock_threshold if product.low_stock_threshold is not None else 5
        variants_out = []
        for v in variant_rows:
            inv_for_variant = [i for i in inventories if getattr(i, "variant_id", None) == v.id]
            v_availability = []
            for inv in inv_for_variant:
                ph = pharmacies.get(inv.pharmacy_id)
                if not ph:
                    continue
                v_availability.append({
                    "pharmacyId": str(inv.pharmacy_id),
                    "pharmacyName": ph.name,
                    "address": ph.address or "",
                    "city": ph.city or "",
                    "price": inv.price,
                    "discountPrice": inv.discount_price,
                    "quantity": inv.quantity,
                    "isAvailable": inv.is_available,
                })
            # Single price/quantity for landing (first pharmacy or min price)
            price_qty = None
            if inv_for_variant:
                first_inv = min(inv_for_variant, key=lambda i: i.price)
                price_qty = {
                    "price": float(first_inv.price),
                    "quantity": first_inv.quantity,
                    "lowStockThreshold": product_low,
                }
            variants_out.append({
                "id": v.id,
                "label": v.label,
                "unit": getattr(v, "unit", None) or "piece",
                "strength": getattr(v, "strength", None) or "",
                "dosageForm": getattr(v, "dosage_form", None) or "",
                "imageUrl": getattr(v, "image_url", None) or "",
                "imageUrls": services.variant_image_urls_for_api(v),
                "availability": v_availability,
                "price": price_qty["price"] if price_qty else None,
                "quantity": price_qty["quantity"] if price_qty else None,
                "lowStockThreshold": price_qty["lowStockThreshold"] if price_qty else product_low,
            })
        data["variants"] = variants_out

        return Response(data)


class ProductVariantsListView(APIView):
    """
    GET list variants for a product (public).
    POST create a variant (owner only, product must belong to owner's pharmacy).
    """

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsOwner()]
        return [AllowAny()]

    def get(self, request, pk):
        try:
            product = services.get_product_by_id(pk)
        except MedicalProduct.DoesNotExist:
            return Response(
                {"detail": "Product not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        variants = services.list_variants_by_product(pk)
        serializer = MedicalProductVariantSerializer(variants, many=True)
        return Response(serializer.data)

    def post(self, request, pk):
        try:
            product = services.get_product_by_id(pk)
        except MedicalProduct.DoesNotExist:
            return Response(
                {"detail": "Product not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        allowed_pharmacy_ids = list(_pharmacy_ids_for_user(request.user))
        if product.pharmacy_id not in allowed_pharmacy_ids:
            return Response(
                {"detail": "You do not have permission to add variants to this product."},
                status=status.HTTP_403_FORBIDDEN,
            )
        in_serializer = ProductVariantCreateSerializer(data=request.data)
        in_serializer.is_valid(raise_exception=True)
        data = in_serializer.validated_data
        raw = request.data
        if "sortOrder" in raw and raw["sortOrder"] is not None and raw["sortOrder"] != "":
            sort_order = data["sortOrder"]
        else:
            sort_order = services.next_variant_sort_order(pk)
        u_raw = (data.get("unit") or "").strip()
        variant = services.create_variant(
            product_id=pk,
            label=data["label"],
            sort_order=sort_order,
            unit=u_raw or "piece",
            strength=data.get("strength"),
            dosage_form=data.get("dosageForm"),
            image_url=data.get("imageUrl"),
            image_urls=data.get("imageUrls"),
        )
        out_serializer = MedicalProductVariantSerializer(variant)
        return Response(out_serializer.data, status=status.HTTP_201_CREATED)


class ProductVariantDetailView(APIView):
    """
    GET/PUT/DELETE a single variant (owner only for write).
    """

    def get_permissions(self):
        if self.request.method in ("PUT", "PATCH", "DELETE"):
            return [IsOwner()]
        return [AllowAny()]

    def get(self, request, pk, variant_pk):
        try:
            variant = services.get_variant_by_id(variant_pk)
        except MedicalProductVariant.DoesNotExist:
            return Response(
                {"detail": "Variant not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        if str(variant.product_id) != str(pk):
            return Response(
                {"detail": "Variant not found for this product."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = MedicalProductVariantSerializer(variant)
        return Response(serializer.data)

    def put(self, request, pk, variant_pk):
        try:
            variant = services.get_variant_by_id(variant_pk)
        except MedicalProductVariant.DoesNotExist:
            return Response(
                {"detail": "Variant not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        if str(variant.product_id) != str(pk):
            return Response(
                {"detail": "Variant not found for this product."},
                status=status.HTTP_404_NOT_FOUND,
            )
        product = services.get_product_by_id(pk)
        allowed_pharmacy_ids = list(_pharmacy_ids_for_user(request.user))
        if product.pharmacy_id not in allowed_pharmacy_ids:
            return Response(
                {"detail": "You do not have permission to update this variant."},
                status=status.HTTP_403_FORBIDDEN,
            )
        in_serializer = ProductVariantUpdateSerializer(data=request.data, partial=True)
        in_serializer.is_valid(raise_exception=True)
        data = in_serializer.validated_data
        variant = services.update_variant(
            variant_pk,
            label=data.get("label"),
            unit=data.get("unit"),
            sort_order=data.get("sortOrder"),
            strength=data.get("strength"),
            dosage_form=data.get("dosageForm"),
            image_url=data.get("imageUrl"),
            image_urls=data.get("imageUrls"),
        )
        out_serializer = MedicalProductVariantSerializer(variant)
        return Response(out_serializer.data)

    def patch(self, request, pk, variant_pk):
        return self.put(request, pk, variant_pk)

    def delete(self, request, pk, variant_pk):
        try:
            variant = services.get_variant_by_id(variant_pk)
        except MedicalProductVariant.DoesNotExist:
            return Response(
                {"detail": "Variant not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        if str(variant.product_id) != str(pk):
            return Response(
                {"detail": "Variant not found for this product."},
                status=status.HTTP_404_NOT_FOUND,
            )
        product = services.get_product_by_id(pk)
        allowed_pharmacy_ids = list(_pharmacy_ids_for_user(request.user))
        if product.pharmacy_id not in allowed_pharmacy_ids:
            return Response(
                {"detail": "You do not have permission to delete this variant."},
                status=status.HTTP_403_FORBIDDEN,
            )
        try:
            result = services.delete_variant(variant_pk)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(result)


class ProductCategoryListView(APIView):
    """
    GET list all product categories.
    """

    permission_classes = [AllowAny]

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsOwner()]
        return [AllowAny()]

    def get(self, request):
        owner_id = request.query_params.get("ownerId")
        if owner_id is None and request.user.is_authenticated:
            role = getattr(request.user, "role", None)
            if role == "owner":
                owner_id = str(request.user.id)
            elif role == "staff":
                try:
                    staff_profile = Staff.objects.get(user_id=str(request.user.id))
                    owner_id = staff_profile.owner_id
                except Staff.DoesNotExist:
                    pass
        categories = services.list_categories(owner_id=owner_id)
        serializer = ProductCategorySerializer(categories, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ProductCategoryCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        owner_id = data.get("ownerId")
        if owner_id is None and request.user.is_authenticated and getattr(request.user, "role", None) == "owner":
            owner_id = str(request.user.id)
        if not owner_id:
            return Response(
                {"detail": "ownerId is required or you must be authenticated as an owner."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        category = services.create_category(
            owner_id=owner_id,
            name=data["name"],
            description=data.get("description"),
            parent_category_id=data.get("parentCategoryId"),
            requires_prescription=data.get("requiresPrescription"),
        )
        out_serializer = ProductCategorySerializer(category)
        return Response(out_serializer.data, status=status.HTTP_201_CREATED)


class ProductCategoryDetailView(APIView):
    """
    GET/PUT/DELETE product category by id.
    """

    permission_classes = [AllowAny]

    def get_permissions(self):
        if self.request.method in ("PUT", "PATCH", "DELETE"):
            return [IsOwner()]
        return [AllowAny()]

    def _owner_can_access(self, request, category) -> bool:
        if not request.user.is_authenticated:
            return False
        if getattr(request.user, "role", None) == "admin":
            return True
        if getattr(request.user, "role", None) == "owner":
            return str(category.owner_id) == str(request.user.id)
        return False

    def get(self, request, pk):
        try:
            category = services.get_category_by_id(pk)
        except ProductCategory.DoesNotExist:
            return Response({"detail": "Category not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = ProductCategorySerializer(category)
        return Response(serializer.data)

    def put(self, request, pk):
        try:
            category = services.get_category_by_id(pk)
        except ProductCategory.DoesNotExist:
            return Response({"detail": "Category not found"}, status=status.HTTP_404_NOT_FOUND)
        if not self._owner_can_access(request, category):
            return Response({"detail": "You do not have permission to update this category."}, status=status.HTTP_403_FORBIDDEN)
        serializer = ProductCategoryUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        category = services.update_category(
            pk,
            name=data.get("name"),
            description=data.get("description"),
            parent_category_id=data.get("parentCategoryId"),
            requires_prescription=data.get("requiresPrescription"),
        )
        out_serializer = ProductCategorySerializer(category)
        return Response(out_serializer.data)

    def patch(self, request, pk):
        return self.put(request, pk)

    def delete(self, request, pk):
        try:
            category = services.get_category_by_id(pk)
        except ProductCategory.DoesNotExist:
            return Response({"detail": "Category not found"}, status=status.HTTP_404_NOT_FOUND)
        if not self._owner_can_access(request, category):
            return Response({"detail": "You do not have permission to delete this category."}, status=status.HTTP_403_FORBIDDEN)
        if MedicalProduct.objects.filter(category_id=pk).exists():
            return Response(
                {"detail": "Cannot delete category because it is used by existing products."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        services.delete_category(pk)
        return Response({"success": True, "id": pk})


class ProductManageView(APIView):
    """
    POST create a product (owner/admin only).
    """

    permission_classes = [IsOwner]

    def post(self, request):
        serializer = MedicalProductCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        pharmacy_id = data.get("pharmacyId") or data.get("pharmacy_id")
        if not pharmacy_id:
            return Response(
                {"detail": "pharmacyId is required when creating a product."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        allowed_pharmacy_ids = list(_pharmacy_ids_for_user(request.user))
        if pharmacy_id not in allowed_pharmacy_ids:
            return Response(
                {"detail": "You do not have permission to create products for this pharmacy."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            pharmacy = Pharmacy.objects.get(pk=pharmacy_id)
        except Pharmacy.DoesNotExist:
            return Response(
                {"detail": "Pharmacy not found."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        owner_id = pharmacy.owner_id
        try:
            resolved_brand_id, resolved_brand_name = services.resolve_brand_for_product_create(
                owner_id,
                data.get("brandId") or data.get("brand_id"),
                data.get("brandName"),
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        try:
            product = services.create_product(
                name=data["name"],
                category_id=data["categoryId"],
                pharmacy_id=pharmacy_id,
                generic_name=data.get("genericName"),
                brand_id=resolved_brand_id,
                brand_name=resolved_brand_name,
                description=data.get("description"),
                manufacturer=data.get("manufacturer"),
                requires_prescription=data.get("requiresPrescription"),
                supplier=data.get("supplier"),
                low_stock_threshold=data.get("lowStockThreshold"),
            )
            # First sellable option is always a real variant (same model as additional variants).
            first_variant_label = (data.get("variantLabel") or "").strip()
            first_variant_unit = (data.get("unit") or "").strip() or "piece"
            first_variant = services.create_variant(
                product_id=product.id,
                label=first_variant_label,
                sort_order=0,
                unit=first_variant_unit,
                strength=data.get("strength"),
                dosage_form=data.get("dosageForm"),
                image_url=data.get("imageUrl"),
            )
            # Create pharmacy_inventory row so owner can manage stock/price without staff
            inventory_services.create_inventory(
                pharmacy_id=pharmacy_id,
                product_id=product.id,
                variant_id=first_variant.id,
                quantity=data.get("quantity", 0),
                price=data.get("price", 0),
                discount_price=data.get("discountPrice"),
                expiry_date=data.get("expiryDate"),
                batch_number=data.get("batchNumber"),
                is_available=data.get("isAvailable", True),
                last_restocked=data.get("lastRestocked"),
            )
        except IntegrityError as exc:
            # Most likely an invalid or non-existent categoryId or missing required field.
            return Response(
                {
                    "detail": "Unable to create product. Check that categoryId refers to an existing category and that all required fields (name, categoryId, variantLabel, unit) are valid.",
                    "error": str(exc),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        out_serializer = MedicalProductSerializer(product)
        out_data = dict(out_serializer.data)
        variants = services.list_variants_by_product(product.id)
        out_data["variants"] = MedicalProductVariantSerializer(variants, many=True).data
        return Response(out_data, status=status.HTTP_201_CREATED)


class ProductManageDetailView(APIView):
    """
    PUT/DELETE a product (owner/admin only).
    """

    permission_classes = [IsOwner]

    def put(self, request, pk):
        serializer = MedicalProductUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        allowed_pharmacy_ids = list(_pharmacy_ids_for_user(request.user))
        try:
            existing = services.get_product_by_id(pk)
        except MedicalProduct.DoesNotExist:
            return Response({"detail": "Product not found"}, status=status.HTTP_404_NOT_FOUND)
        if existing.pharmacy_id not in allowed_pharmacy_ids:
            return Response(
                {"detail": "You do not have permission to update this product."},
                status=status.HTTP_403_FORBIDDEN,
            )

        pharmacy_id = data.get("pharmacyId") or data.get("pharmacy_id")
        if pharmacy_id is not None and pharmacy_id not in allowed_pharmacy_ids:
            return Response(
                {"detail": "You do not have permission to assign this product to that pharmacy."},
                status=status.HTTP_403_FORBIDDEN,
            )

        effective_pharmacy_id = pharmacy_id if pharmacy_id is not None else existing.pharmacy_id
        raw = request.data
        has_brand_keys = (
            "brandId" in raw or "brand_id" in raw or "brandName" in raw
        )
        brand_fields = None
        if has_brand_keys:
            if not effective_pharmacy_id:
                return Response(
                    {"detail": "Cannot update brand without a pharmacy on the product."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            try:
                ph = Pharmacy.objects.get(pk=effective_pharmacy_id)
            except Pharmacy.DoesNotExist:
                return Response(
                    {"detail": "Pharmacy not found."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            try:
                brand_fields = services.resolve_brand_for_product_update(ph.owner_id, raw)
            except ValueError as exc:
                return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        try:
            product = services.update_product(
                pk,
                name=data.get("name"),
                pharmacy_id=pharmacy_id,
                generic_name=data.get("genericName"),
                brand_fields=brand_fields,
                description=data.get("description"),
                manufacturer=data.get("manufacturer"),
                category_id=data.get("categoryId"),
                requires_prescription=data.get("requiresPrescription"),
                supplier=data.get("supplier"),
                low_stock_threshold=data.get("lowStockThreshold"),
            )
        except MedicalProduct.DoesNotExist:
            return Response({"detail": "Product not found"}, status=status.HTTP_404_NOT_FOUND)

        # Update or create pharmacy_inventory for this product at its pharmacy (optionally for a variant)
        inv_pharmacy_id = product.pharmacy_id
        variant_id = data.get("variantId") or None
        if inv_pharmacy_id and inv_pharmacy_id in allowed_pharmacy_ids:
            inv_qs = PharmacyInventory.objects.filter(
                pharmacy_id=inv_pharmacy_id,
                product_id=product.id,
                variant_id=variant_id,
            )
            inv_data = {
                "quantity": data.get("quantity"),
                "price": data.get("price"),
                "discountPrice": data.get("discountPrice"),
                "expiryDate": data.get("expiryDate"),
                "batchNumber": data.get("batchNumber"),
                "isAvailable": data.get("isAvailable"),
                "lastRestocked": data.get("lastRestocked"),
            }
            if any(v is not None for v in inv_data.values()):
                if inv_qs.exists():
                    record = inv_qs.first()
                    inventory_services.update_inventory(
                        str(record.id),
                        variant_id=variant_id,
                        quantity=inv_data["quantity"],
                        price=inv_data["price"],
                        discount_price=inv_data["discountPrice"],
                        expiry_date=inv_data["expiryDate"],
                        batch_number=inv_data["batchNumber"],
                        is_available=inv_data["isAvailable"],
                        last_restocked=inv_data["lastRestocked"],
                    )
                else:
                    inventory_services.create_inventory(
                        pharmacy_id=inv_pharmacy_id,
                        product_id=product.id,
                        variant_id=variant_id,
                        quantity=inv_data["quantity"] if inv_data["quantity"] is not None else 0,
                        price=inv_data["price"] if inv_data["price"] is not None else 0,
                        discount_price=inv_data["discountPrice"],
                        expiry_date=inv_data["expiryDate"],
                        batch_number=inv_data["batchNumber"],
                        is_available=inv_data["isAvailable"] if inv_data["isAvailable"] is not None else True,
                        last_restocked=inv_data["lastRestocked"],
                    )
        out_serializer = MedicalProductSerializer(product)
        return Response(out_serializer.data)

    def delete(self, request, pk):
        try:
            product = services.get_product_by_id(pk)
        except MedicalProduct.DoesNotExist:
            return Response({"detail": "Product not found"}, status=status.HTTP_404_NOT_FOUND)
        allowed_pharmacy_ids = list(_pharmacy_ids_for_user(request.user))
        if product.pharmacy_id not in allowed_pharmacy_ids:
            return Response(
                {"detail": "You do not have permission to delete this product."},
                status=status.HTTP_403_FORBIDDEN,
            )
        services.delete_product(pk)
        return Response({"success": True, "id": pk})


class ProductManageVariantImageUploadView(APIView):
    """
    POST multipart/form-data with field `file`.
    Owner only; updates image_url on the given variant.
    """

    permission_classes = [IsOwner]

    def post(self, request, pk, variant_pk):
        try:
            product = services.get_product_by_id(pk)
        except MedicalProduct.DoesNotExist:
            return Response({"detail": "Product not found"}, status=status.HTTP_404_NOT_FOUND)

        allowed_pharmacy_ids = list(_pharmacy_ids_for_user(request.user))
        if product.pharmacy_id not in allowed_pharmacy_ids:
            return Response(
                {"detail": "You do not have permission to modify this product."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            variant = services.get_variant_by_id(variant_pk)
        except MedicalProductVariant.DoesNotExist:
            return Response({"detail": "Variant not found"}, status=status.HTTP_404_NOT_FOUND)
        if str(variant.product_id) != str(pk):
            return Response(
                {"detail": "Variant not found for this product."},
                status=status.HTTP_404_NOT_FOUND,
            )

        upload = request.FILES.get("file")
        if not upload:
            return Response({"detail": "Missing file field."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            variant = services.save_variant_image_upload(
                product_id=pk,
                variant_id=variant_pk,
                uploaded_file=upload,
                build_absolute_uri=lambda path: request.build_absolute_uri(path),
            )
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        out_serializer = MedicalProductVariantSerializer(variant)
        return Response(out_serializer.data, status=status.HTTP_200_OK)


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
