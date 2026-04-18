"""
Analytics business logic and aggregate queries.
"""
import uuid
from typing import Any, Dict, List, Optional

from datetime import timedelta

from django.db.models import Count
from django.db.models.functions import Extract, TruncDate, TruncMonth, TruncWeek
from django.utils import timezone

from api.v1.brands.models import OwnerBrand
from api.v1.deletion_requests.models import DeletionRequest
from api.v1.inventory.models import PharmacyInventory
from api.v1.pharmacies.models import Pharmacy
from api.v1.products.models import MedicalProduct, MedicalProductVariant, ProductCategory, ProductSearch
from api.v1.reservations.models import ProductReservation
from api.v1.reviews.models import PharmacyReview, ProductReview
from api.v1.staff.models import Staff
from api.v1.users.models import User

from .models import AuditEvent, ProductPageEngagement, ProductSearchSelection


def get_platform_stats() -> Dict[str, int]:
    """
    Aggregate high-level platform metrics.
    """
    total_pharmacies = Pharmacy.objects.count()
    total_inventory_items = PharmacyInventory.objects.count()
    total_reservations = ProductReservation.objects.count()

    return {
        "totalPharmacies": total_pharmacies,
        "totalInventoryItems": total_inventory_items,
        "totalReservations": total_reservations,
    }


def get_owner_stats(owner_id: str) -> Dict[str, int]:
    """
    Aggregate metrics scoped to a specific owner (dashboard cards).
    """
    pharmacies_qs = Pharmacy.objects.filter(owner_id=owner_id)
    pharmacy_ids = list(pharmacies_qs.values_list("id", flat=True))

    products_qs = MedicalProduct.objects.filter(pharmacy_id__in=pharmacy_ids)
    product_ids = list(products_qs.values_list("id", flat=True))
    products_count = products_qs.count()
    variants_count = (
        MedicalProductVariant.objects.filter(product_id__in=product_ids).count() if product_ids else 0
    )
    # Total catalog SKUs: variant rows are the sellable units. Summing products + variants
    # double-counts the default variant on each product (1 product + 1 variant → 2).
    products_and_variants_count = max(products_count, variants_count)

    staff_active_count = Staff.objects.filter(owner_id=owner_id, is_active=True).count()
    staff_inactive_count = Staff.objects.filter(owner_id=owner_id, is_active=False).count()

    inv_rows = list(PharmacyInventory.objects.filter(pharmacy_id__in=pharmacy_ids))
    inv_product_ids = {row.product_id for row in inv_rows}
    product_low_map = {
        p.id: (p.low_stock_threshold if p.low_stock_threshold is not None else 5)
        for p in MedicalProduct.objects.filter(id__in=inv_product_ids)
    }
    inventory_in_stock_count = 0
    inventory_low_stock_count = 0
    inventory_out_of_stock_count = 0
    for row in inv_rows:
        th = product_low_map.get(row.product_id, 5)
        q = int(row.quantity or 0)
        if q <= 0:
            inventory_out_of_stock_count += 1
            continue
        if q <= th:
            inventory_low_stock_count += 1
        else:
            inventory_in_stock_count += 1

    pending_deletion_requests_count = DeletionRequest.objects.filter(
        pharmacy_id__in=pharmacy_ids,
        status="pending",
    ).count()

    categories_count = ProductCategory.objects.filter(owner_id=owner_id).count()
    brands_count = OwnerBrand.objects.filter(owner_id=owner_id).count()

    return {
        "productsAndVariantsCount": products_and_variants_count,
        "staffActiveCount": staff_active_count,
        "staffInactiveCount": staff_inactive_count,
        "inventoryInStockCount": inventory_in_stock_count,
        "inventoryLowStockCount": inventory_low_stock_count,
        "inventoryOutOfStockCount": inventory_out_of_stock_count,
        "pendingDeletionRequestsCount": pending_deletion_requests_count,
        "categoriesCount": categories_count,
        "brandsCount": brands_count,
    }


def get_staff_stats(user_id: str) -> Dict[str, int]:
    """
    Aggregate metrics scoped to a staff user.
    Currently based on reservations made by the user.
    """
    active_reservations = ProductReservation.objects.filter(
        customer_id=user_id,
        status__in=["pending", "confirmed"],
    ).count()
    completed_reservations = ProductReservation.objects.filter(
        customer_id=user_id,
        status="completed",
    ).count()

    return {
        "activeReservations": active_reservations,
        "completedReservations": completed_reservations,
    }


def get_monthly_sales(*, owner_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Simple monthly sales aggregation based on completed reservations.
    """
    reservations = ProductReservation.objects.filter(status="completed")

    if owner_id:
        pharmacies_qs = Pharmacy.objects.filter(owner_id=owner_id)
        pharmacy_ids = list(pharmacies_qs.values_list("id", flat=True))
        inventory_ids = list(
            PharmacyInventory.objects.filter(pharmacy_id__in=pharmacy_ids).values_list("id", flat=True)
        )
        reservations = reservations.filter(inventory_id__in=inventory_ids)

    qs = (
        reservations.annotate(month=TruncMonth("created_at"))
        .values("month")
        .annotate(total=Count("id"))
        .order_by("month")
    )

    data: List[Dict[str, Any]] = []
    for row in qs:
        month = row["month"]
        data.append(
            {
                "name": month.strftime("%b") if month else "",
                "sales": float(row["total"]),
            }
        )
    return data


def get_top_products(
    *,
    owner_id: Optional[str] = None,
    limit: int = 5,
) -> List[Dict[str, Any]]:
    """
    Compute top products by number of inventory entries, optionally scoped to an owner.
    """
    inventory_qs = PharmacyInventory.objects.all()

    if owner_id:
        pharmacies_qs = Pharmacy.objects.filter(owner_id=owner_id)
        pharmacy_ids = list(pharmacies_qs.values_list("id", flat=True))
        inventory_qs = inventory_qs.filter(pharmacy_id__in=pharmacy_ids)

    aggregated = (
        inventory_qs.values("product_id")
        .annotate(total=Count("id"))
        .order_by("-total")[:limit]
    )

    product_ids = [row["product_id"] for row in aggregated]
    product_map = {
        p.id: p.name
        for p in MedicalProduct.objects.filter(id__in=product_ids)
    }

    results: List[Dict[str, Any]] = []
    for row in aggregated:
        product_id = row["product_id"]
        name = product_map.get(product_id, product_id)
        results.append(
            {
                "name": name,
                "value": float(row["total"]),
            }
        )
    return results


def get_top_categories_by_products(
    *,
    owner_id: Optional[str] = None,
    limit: int = 8,
) -> List[Dict[str, Any]]:
    """
    Product counts grouped by category name for the owner's catalog.
    """
    product_qs = MedicalProduct.objects.all()
    if owner_id:
        pharmacy_ids = list(Pharmacy.objects.filter(owner_id=owner_id).values_list("id", flat=True))
        product_qs = product_qs.filter(pharmacy_id__in=pharmacy_ids)

    aggregated = (
        product_qs.values("category_id")
        .annotate(total=Count("id"))
        .order_by("-total")[:limit]
    )
    cat_ids = [row["category_id"] for row in aggregated]
    name_map = {
        c.id: c.name
        for c in ProductCategory.objects.filter(id__in=cat_ids)
    }
    results: List[Dict[str, Any]] = []
    for row in aggregated:
        cid = row["category_id"]
        name = name_map.get(cid, cid or "Uncategorized")
        results.append({"name": name, "value": float(row["total"])})
    return results


def get_owner_top_search_queries(*, owner_id: str, limit: int = 20) -> List[Dict[str, Any]]:
    """
    Most frequent search queries where results included at least one of the owner's pharmacies.
    """
    qs = (
        ProductSearch.objects.filter(matched_owner_ids__contains=[owner_id])
        .exclude(search_query__exact="")
        .values("search_query")
        .annotate(count=Count("id"))
        .order_by("-count")[:limit]
    )
    return [{"query": row["search_query"], "count": row["count"]} for row in qs]


def record_product_engagement(
    *,
    product_id: str,
    user_id: Optional[str],
    session_id: Optional[str],
    dwell_seconds: int,
) -> None:
    ProductPageEngagement.objects.create(
        id=str(uuid.uuid4()),
        product_id=product_id,
        user_id=user_id,
        session_id=session_id,
        dwell_seconds=max(0, int(dwell_seconds)),
        created_at=timezone.now(),
    )


def get_owner_review_rating_distribution(*, owner_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Count of reviews (pharmacy + product) per star rating 1–5 for the owner's scope.
    When owner_id is None (e.g. admin with no filter), returns five zeros.
    """
    counts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    if not owner_id:
        return [{"name": str(s), "value": 0.0} for s in range(1, 6)]

    pharmacy_ids = list(Pharmacy.objects.filter(owner_id=owner_id).values_list("id", flat=True))
    product_ids = list(
        MedicalProduct.objects.filter(pharmacy_id__in=pharmacy_ids).values_list("id", flat=True)
    )
    if pharmacy_ids:
        for row in (
            PharmacyReview.objects.filter(pharmacy_id__in=pharmacy_ids)
            .values("rating")
            .annotate(total=Count("id"))
        ):
            r = row["rating"]
            if r in counts:
                counts[r] += row["total"]
    if product_ids:
        for row in (
            ProductReview.objects.filter(product_id__in=product_ids)
            .values("rating")
            .annotate(total=Count("id"))
        ):
            r = row["rating"]
            if r in counts:
                counts[r] += row["total"]

    return [{"name": str(s), "value": float(counts[s])} for s in range(1, 6)]


def get_owner_top_products_by_views(*, owner_id: Optional[str], limit: int = 10) -> List[Dict[str, Any]]:
    """
    Products with the most recorded detail-page engagement events for this owner's catalog.
    """
    if not owner_id:
        return []
    pharmacy_ids = list(Pharmacy.objects.filter(owner_id=owner_id).values_list("id", flat=True))
    product_ids = list(
        MedicalProduct.objects.filter(pharmacy_id__in=pharmacy_ids).values_list("id", flat=True)
    )
    if not product_ids:
        return []
    aggregated = (
        ProductPageEngagement.objects.filter(product_id__in=product_ids)
        .values("product_id")
        .annotate(total=Count("id"))
        .order_by("-total")[:limit]
    )
    results: List[Dict[str, Any]] = []
    for row in aggregated:
        pid = row["product_id"]
        name = MedicalProduct.objects.filter(id=pid).values_list("name", flat=True).first() or pid
        results.append({"name": name, "value": float(row["total"])})
    return results


def _owner_product_ids(owner_id: str) -> List[str]:
    pharmacy_ids = list(Pharmacy.objects.filter(owner_id=owner_id).values_list("id", flat=True))
    return list(MedicalProduct.objects.filter(pharmacy_id__in=pharmacy_ids).values_list("id", flat=True))


def get_owner_search_trends(
    *,
    owner_id: Optional[str],
    granularity: str = "daily",
) -> List[Dict[str, Any]]:
    """
    Search volume over time for rows attributed to this owner (matched_owner_ids).
    daily: last 30 days by calendar day; weekly: last 12 ISO weeks.
    """
    if not owner_id:
        return []
    qs = ProductSearch.objects.filter(matched_owner_ids__contains=[owner_id]).exclude(search_query__exact="")
    now = timezone.now()
    if granularity == "weekly":
        start = now - timedelta(weeks=12)
        qs = qs.filter(searched_at__gte=start)
        rows = (
            qs.annotate(period=TruncWeek("searched_at"))
            .values("period")
            .annotate(count=Count("id"))
            .order_by("period")
        )
        out: List[Dict[str, Any]] = []
        for row in rows:
            p = row["period"]
            label = p.strftime("%Y-%m-%d") if p else ""
            out.append({"name": label, "count": row["count"]})
        return out
    start = now - timedelta(days=30)
    qs = qs.filter(searched_at__gte=start)
    rows = (
        qs.annotate(period=TruncDate("searched_at"))
        .values("period")
        .annotate(count=Count("id"))
        .order_by("period")
    )
    return [
        {
            "name": row["period"].strftime("%Y-%m-%d") if row["period"] else "",
            "count": row["count"],
        }
        for row in rows
    ]


def get_owner_search_peak_hours(*, owner_id: Optional[str]) -> List[Dict[str, Any]]:
    """
    Search counts by hour of day (0-23) for owner-attributed searches.
    """
    if not owner_id:
        return [{"hour": h, "count": 0} for h in range(24)]
    qs = ProductSearch.objects.filter(matched_owner_ids__contains=[owner_id]).exclude(search_query__exact="")
    rows = (
        qs.annotate(hour=Extract("searched_at", "hour"))
        .values("hour")
        .annotate(count=Count("id"))
    )
    by_h = {row["hour"]: row["count"] for row in rows if row["hour"] is not None}
    return [{"hour": int(h), "count": int(by_h.get(h, 0))} for h in range(24)]


def get_owner_no_result_search_queries(*, limit: int = 25) -> List[Dict[str, Any]]:
    """
    Top search queries that returned zero rows (platform-wide).
    Owner cannot be inferred when results_count is 0 (matched_owner_ids is empty).
    """
    qs = (
        ProductSearch.objects.filter(results_count=0)
        .exclude(search_query__exact="")
        .values("search_query")
        .annotate(count=Count("id"))
        .order_by("-count")[:limit]
    )
    return [{"query": row["search_query"], "count": row["count"]} for row in qs]


def get_owner_bottom_products_by_views(*, owner_id: Optional[str], limit: int = 10) -> List[Dict[str, Any]]:
    """
    Products with the fewest detail-page engagements (among products that have at least one view).
    """
    if not owner_id:
        return []
    product_ids = _owner_product_ids(owner_id)
    if not product_ids:
        return []
    aggregated = (
        ProductPageEngagement.objects.filter(product_id__in=product_ids)
        .values("product_id")
        .annotate(total=Count("id"))
        .filter(total__gt=0)
        .order_by("total")[:limit]
    )
    results: List[Dict[str, Any]] = []
    for row in aggregated:
        pid = row["product_id"]
        name = MedicalProduct.objects.filter(id=pid).values_list("name", flat=True).first() or pid
        results.append({"name": name, "value": float(row["total"])})
    return results


def get_owner_trending_products_by_views(
    *,
    owner_id: Optional[str],
    window_days: int = 7,
    limit: int = 10,
) -> List[Dict[str, Any]]:
    """
    Products with the largest increase in views: recent window vs previous window of equal length.
    """
    if not owner_id:
        return []
    product_ids = _owner_product_ids(owner_id)
    if not product_ids:
        return []
    now = timezone.now()
    recent_start = now - timedelta(days=window_days)
    prev_start = now - timedelta(days=window_days * 2)
    prev_end = recent_start

    recent_counts = {
        row["product_id"]: row["total"]
        for row in (
            ProductPageEngagement.objects.filter(
                product_id__in=product_ids,
                created_at__gte=recent_start,
            )
            .values("product_id")
            .annotate(total=Count("id"))
        )
    }
    prev_counts = {
        row["product_id"]: row["total"]
        for row in (
            ProductPageEngagement.objects.filter(
                product_id__in=product_ids,
                created_at__gte=prev_start,
                created_at__lt=prev_end,
            )
            .values("product_id")
            .annotate(total=Count("id"))
        )
    }
    deltas: Dict[str, int] = {}
    for pid in set(recent_counts) | set(prev_counts):
        deltas[pid] = int(recent_counts.get(pid, 0)) - int(prev_counts.get(pid, 0))
    # Only increases (pie chart expects positive weights)
    sorted_ids = sorted(
        [p for p in deltas if deltas[p] > 0],
        key=lambda p: deltas[p],
        reverse=True,
    )[:limit]
    results: List[Dict[str, Any]] = []
    for pid in sorted_ids:
        name = MedicalProduct.objects.filter(id=pid).values_list("name", flat=True).first() or pid
        results.append({"name": name, "value": float(deltas[pid])})
    return results


def get_owner_high_demand_out_of_stock(
    *,
    owner_id: Optional[str],
    limit: int = 10,
    engagement_window_days: int = 30,
) -> List[Dict[str, Any]]:
    """
    Products with high recent detail-page views that have at least one out-of-stock inventory row
    in the owner's pharmacies.
    """
    if not owner_id:
        return []
    pharmacy_ids = list(Pharmacy.objects.filter(owner_id=owner_id).values_list("id", flat=True))
    product_ids = _owner_product_ids(owner_id)
    if not product_ids:
        return []
    since = timezone.now() - timedelta(days=engagement_window_days)
    oos_product_ids = set(
        PharmacyInventory.objects.filter(
            pharmacy_id__in=pharmacy_ids,
            product_id__in=product_ids,
        )
        .filter(quantity__lte=0)
        .values_list("product_id", flat=True)
        .distinct()
    )
    if not oos_product_ids:
        return []
    ranked = (
        ProductPageEngagement.objects.filter(product_id__in=oos_product_ids, created_at__gte=since)
        .values("product_id")
        .annotate(total=Count("id"))
        .order_by("-total")
    )
    results: List[Dict[str, Any]] = []
    for row in ranked:
        if len(results) >= limit:
            break
        pid = row["product_id"]
        name = MedicalProduct.objects.filter(id=pid).values_list("name", flat=True).first() or pid
        results.append({"name": name, "value": float(row["total"])})
    return results


def log_audit_event(
    *,
    owner_id: str,
    actor_user_id: Optional[str],
    actor_role: str,
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    details: str = "",
) -> None:
    AuditEvent.objects.create(
        id=str(uuid.uuid4()),
        owner_id=owner_id,
        actor_user_id=actor_user_id,
        actor_role=actor_role[:32],
        action=action[:64],
        resource_type=resource_type[:64],
        resource_id=resource_id,
        details=(details or "")[:4000],
        created_at=timezone.now(),
    )


def list_audit_events_for_owner(*, owner_id: str, limit: int = 200) -> List[Dict[str, Any]]:
    rows = AuditEvent.objects.filter(owner_id=owner_id).order_by("-created_at")[: max(1, min(limit, 500))]
    out: List[Dict[str, Any]] = []
    for ev in rows:
        actor_label = ev.actor_user_id or "—"
        out.append(
            {
                "id": ev.id,
                "createdAt": ev.created_at.isoformat() if ev.created_at else "",
                "actorRole": ev.actor_role
                if ev.actor_role in ("owner", "staff", "admin", "customer")
                else None,
                "actor": actor_label,
                "action": ev.action,
                "resource": f"{ev.resource_type}:{ev.resource_id or '—'}",
                "details": ev.details or "",
            }
        )
    return out


def record_product_search_selection(
    *,
    product_id: str,
    pharmacy_id: Optional[str],
    search_query: Optional[str],
    customer_id: Optional[str],
) -> None:
    owner_id: Optional[str] = None
    if pharmacy_id:
        oid = Pharmacy.objects.filter(id=pharmacy_id).values_list("owner_id", flat=True).first()
        if oid:
            owner_id = str(oid)
    if not owner_id:
        return
    ProductSearchSelection.objects.create(
        id=str(uuid.uuid4()),
        product_id=product_id,
        pharmacy_id=pharmacy_id,
        owner_id=owner_id,
        search_query=(search_query or "")[:2000],
        customer_id=customer_id,
        created_at=timezone.now(),
    )


def get_owner_top_staff_by_audit_actions(*, owner_id: Optional[str], limit: int = 10) -> List[Dict[str, Any]]:
    """
    Staff members with the most audit events for this owner (actor_role=staff only).
    Requires actor_user_id to belong to this owner's Staff roster.
    """
    if not owner_id:
        return []
    staff_user_ids = list(Staff.objects.filter(owner_id=owner_id).values_list("user_id", flat=True))
    if not staff_user_ids:
        return []
    aggregated = (
        AuditEvent.objects.filter(
            owner_id=owner_id,
            actor_role="staff",
            actor_user_id__in=staff_user_ids,
        )
        .values("actor_user_id")
        .annotate(total=Count("id"))
        .order_by("-total")[:limit]
    )
    results: List[Dict[str, Any]] = []
    for row in aggregated:
        uid = row["actor_user_id"]
        u = User.objects.filter(id=uid).first() if uid else None
        if u:
            parts = [p for p in [(u.first_name or "").strip(), (u.last_name or "").strip()] if p]
            name = " ".join(parts) if parts else (u.email or uid)
        else:
            name = str(uid) if uid else "Unknown"
        results.append({"name": name, "value": float(row["total"])})
    return results


def get_owner_top_products_by_search_selections(*, owner_id: Optional[str], limit: int = 10) -> List[Dict[str, Any]]:
    """
    Products most often opened from search results (requires client POST telemetry).
    """
    if not owner_id:
        return []
    aggregated = (
        ProductSearchSelection.objects.filter(owner_id=owner_id)
        .values("product_id")
        .annotate(total=Count("id"))
        .order_by("-total")[:limit]
    )
    results: List[Dict[str, Any]] = []
    for row in aggregated:
        pid = row["product_id"]
        name = MedicalProduct.objects.filter(id=pid).values_list("name", flat=True).first() or pid
        results.append({"name": name, "value": float(row["total"])})
    return results


