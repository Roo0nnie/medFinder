"""
Admin read services.

Builds display-ready "row" dictionaries from existing tables only.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from django.db.models import Q
from django.db.models import Count, Sum
from django.db.models.functions import TruncMonth
from django.utils import timezone

from api.v1.analytics.models import AuditEvent, ProductPageEngagement
from api.v1.brands.models import Brand
from api.v1.inventory.models import PharmacyInventory
from api.v1.pharmacies.models import Pharmacy
from api.v1.products.models import MedicalProduct, MedicalProductVariant, ProductCategory, ProductSearch
from api.v1.reservations.models import ProductReservation
from api.v1.reviews.models import PharmacyReview, ProductReview
from api.v1.staff.models import Staff
from api.v1.users.models import User


def _user_label(u: Optional[User]) -> str:
    if not u:
        return "—"
    parts = [p for p in [(u.first_name or "").strip(), (u.last_name or "").strip()] if p]
    return " ".join(parts) if parts else (u.email or str(u.id))


def list_admin_users(*, search: str = "") -> List[Dict[str, Any]]:
    qs = User.objects.all().order_by("-updated_at")
    if search:
        s = search.strip()
        qs = qs.filter(Q(email__icontains=s) | Q(first_name__icontains=s) | Q(last_name__icontains=s))

    users = list(qs[:2000])
    user_ids = [str(u.id) for u in users]

    owned_counts = {
        str(row["owner_id"]): int(row["total"])
        for row in Pharmacy.objects.filter(owner_id__in=user_ids)
        .values("owner_id")
        .annotate(total=Count("id"))
    }
    staff_counts = {
        str(row["user_id"]): int(row["total"])
        for row in Staff.objects.filter(user_id__in=user_ids)
        .values("user_id")
        .annotate(total=Count("id"))
    }
    reservation_counts = {
        str(row["customer_id"]): int(row["total"])
        for row in ProductReservation.objects.filter(customer_id__in=user_ids)
        .values("customer_id")
        .annotate(total=Count("id"))
    }

    out: List[Dict[str, Any]] = []
    for u in users:
        uid = str(u.id)
        out.append(
            {
                "id": uid,
                "name": _user_label(u),
                "email": u.email,
                "role": u.role,
                "phone": u.phone,
                "emailVerified": bool(u.email_verified),
                "ownedPharmaciesCount": int(owned_counts.get(uid, 0)),
                "staffAssignmentsCount": int(staff_counts.get(uid, 0)),
                "reservationsCount": int(reservation_counts.get(uid, 0)),
                "createdAt": u.created_at.isoformat() if u.created_at else "",
                "updatedAt": u.updated_at.isoformat() if u.updated_at else "",
            }
        )
    return out


def list_admin_pharmacies(*, status: Optional[str] = None, search: str = "") -> List[Dict[str, Any]]:
    qs = Pharmacy.objects.all().order_by("-updated_at")
    if status:
        qs = qs.filter(certificate_status=status)
    if search:
        s = search.strip()
        qs = qs.filter(Q(name__icontains=s) | Q(city__icontains=s) | Q(state__icontains=s))

    pharmacies = list(qs[:3000])
    owner_ids = list({str(p.owner_id) for p in pharmacies})
    owners = {str(u.id): u for u in User.objects.filter(id__in=owner_ids)}

    pharmacy_ids = [str(p.id) for p in pharmacies]
    product_counts = {
        str(row["pharmacy_id"]): int(row["total"])
        for row in MedicalProduct.objects.filter(pharmacy_id__in=pharmacy_ids)
        .values("pharmacy_id")
        .annotate(total=Count("id"))
    }
    review_counts = {
        str(row["pharmacy_id"]): int(row["total"])
        for row in PharmacyReview.objects.filter(pharmacy_id__in=pharmacy_ids)
        .values("pharmacy_id")
        .annotate(total=Count("id"))
    }

    out: List[Dict[str, Any]] = []
    for p in pharmacies:
        oid = str(p.owner_id)
        owner = owners.get(oid)
        customer_visible = bool(p.is_active) and str(p.certificate_status) == "approved"
        out.append(
            {
                "id": str(p.id),
                "name": p.name,
                "ownerId": oid,
                "ownerName": _user_label(owner),
                "ownerEmail": owner.email if owner else None,
                "isActive": bool(p.is_active),
                "certificateStatus": p.certificate_status,
                "certificateNumber": p.certificate_number,
                "certificateFileUrl": p.certificate_file_url,
                "certificateSubmittedAt": p.certificate_submitted_at.isoformat() if p.certificate_submitted_at else None,
                "certificateReviewedAt": p.certificate_reviewed_at.isoformat() if p.certificate_reviewed_at else None,
                "certificateReviewedBy": p.certificate_reviewed_by,
                "certificateReviewNote": p.certificate_review_note,
                "customerVisible": customer_visible,
                "productCount": int(product_counts.get(str(p.id), 0)),
                "reviewCount": int(review_counts.get(str(p.id), 0)),
                "updatedAt": p.updated_at.isoformat() if p.updated_at else "",
            }
        )
    return out


def _stock_health(*, total_qty: int, threshold: int) -> str:
    if total_qty <= 0:
        return "out"
    if total_qty <= threshold:
        return "low"
    return "ok"


def list_admin_products(*, search: str = "") -> List[Dict[str, Any]]:
    qs = MedicalProduct.objects.all().order_by("-updated_at")
    if search:
        s = search.strip()
        qs = qs.filter(Q(name__icontains=s) | Q(generic_name__icontains=s) | Q(brand_name__icontains=s))

    products = list(qs[:4000])
    pharmacy_ids = list({str(p.pharmacy_id) for p in products if p.pharmacy_id})
    pharmacies = {str(p.id): p for p in Pharmacy.objects.filter(id__in=pharmacy_ids)}
    owner_ids = list({str(ph.owner_id) for ph in pharmacies.values()})
    owners = {str(u.id): u for u in User.objects.filter(id__in=owner_ids)}

    category_ids = list({str(p.category_id) for p in products if p.category_id})
    categories = {str(c.id): c for c in ProductCategory.objects.filter(id__in=category_ids)}

    brand_ids = list({str(p.brand_id) for p in products if p.brand_id})
    brands = {str(b.id): b for b in Brand.objects.filter(id__in=brand_ids)}

    product_ids = [str(p.id) for p in products]
    variant_counts = {
        str(row["product_id"]): int(row["total"])
        for row in MedicalProductVariant.objects.filter(product_id__in=product_ids)
        .values("product_id")
        .annotate(total=Count("id"))
    }
    inventory_totals = {
        str(row["product_id"]): int(row["qty"] or 0)
        for row in PharmacyInventory.objects.filter(product_id__in=product_ids)
        .values("product_id")
        .annotate(qty=Sum("quantity"))
    }

    out: List[Dict[str, Any]] = []
    for p in products:
        ph = pharmacies.get(str(p.pharmacy_id)) if p.pharmacy_id else None
        owner = owners.get(str(ph.owner_id)) if ph else None
        cat = categories.get(str(p.category_id)) if p.category_id else None
        b = brands.get(str(p.brand_id)) if p.brand_id else None
        total_qty = int(inventory_totals.get(str(p.id), 0))
        threshold = int(p.low_stock_threshold if p.low_stock_threshold is not None else 5)
        out.append(
            {
                "id": str(p.id),
                "name": p.name,
                "pharmacyId": str(p.pharmacy_id) if p.pharmacy_id else None,
                "pharmacyName": ph.name if ph else None,
                "ownerId": str(ph.owner_id) if ph else None,
                "ownerName": _user_label(owner) if owner else None,
                "categoryId": str(p.category_id),
                "categoryName": cat.name if cat else None,
                "brandId": str(p.brand_id) if p.brand_id else None,
                "brandName": (b.name if b else (p.brand_name or None)),
                "variantsCount": int(variant_counts.get(str(p.id), 0)),
                "inventoryTotal": total_qty,
                "stockHealth": _stock_health(total_qty=total_qty, threshold=threshold),
                "requiresPrescription": bool(p.requires_prescription),
                "updatedAt": p.updated_at.isoformat() if p.updated_at else "",
            }
        )
    return out


def list_admin_categories(*, owner_id: Optional[str] = None, rx: Optional[bool] = None, search: str = "") -> List[Dict[str, Any]]:
    qs = ProductCategory.objects.all().order_by("name")
    if owner_id:
        qs = qs.filter(owner_id=str(owner_id))
    if rx is not None:
        qs = qs.filter(requires_prescription=bool(rx))
    if search:
        s = search.strip()
        qs = qs.filter(name__icontains=s)

    categories = list(qs[:5000])
    owner_ids = list({str(c.owner_id) for c in categories})
    owners = {str(u.id): u for u in User.objects.filter(id__in=owner_ids)}

    cat_ids = [str(c.id) for c in categories]
    product_counts = {
        str(row["category_id"]): int(row["total"])
        for row in MedicalProduct.objects.filter(category_id__in=cat_ids)
        .values("category_id")
        .annotate(total=Count("id"))
    }

    cat_map = {str(c.id): c for c in categories}
    out: List[Dict[str, Any]] = []
    for c in categories:
        parent = cat_map.get(str(c.parent_category_id)) if c.parent_category_id else None
        owner = owners.get(str(c.owner_id))
        out.append(
            {
                "id": str(c.id),
                "name": c.name,
                "description": c.description,
                "ownerId": str(c.owner_id),
                "ownerName": _user_label(owner),
                "parentId": str(c.parent_category_id) if c.parent_category_id else None,
                "parentName": parent.name if parent else None,
                "requiresPrescription": bool(c.requires_prescription),
                "productCount": int(product_counts.get(str(c.id), 0)),
                "createdAt": c.created_at.isoformat() if c.created_at else "",
                "updatedAt": c.updated_at.isoformat() if c.updated_at else "",
            }
        )
    return out


def list_admin_reviews(*, pharmacy_id: Optional[str] = None, rating: Optional[int] = None, search: str = "") -> List[Dict[str, Any]]:
    qs = PharmacyReview.objects.all().order_by("-created_at")
    if pharmacy_id:
        qs = qs.filter(pharmacy_id=str(pharmacy_id))
    if rating is not None:
        qs = qs.filter(rating=int(rating))

    reviews = list(qs[:4000])
    user_ids = list({str(r.user_id) for r in reviews})
    pharmacy_ids = list({str(r.pharmacy_id) for r in reviews})
    users = {str(u.id): u for u in User.objects.filter(id__in=user_ids)}
    pharmacies = {str(p.id): p for p in Pharmacy.objects.filter(id__in=pharmacy_ids)}

    out: List[Dict[str, Any]] = []
    for r in reviews:
        u = users.get(str(r.user_id))
        p = pharmacies.get(str(r.pharmacy_id))
        if search:
            s = search.strip().lower()
            hay = " ".join(
                [
                    str(r.comment or ""),
                    _user_label(u),
                    (u.email if u else ""),
                    (p.name if p else ""),
                ]
            ).lower()
            if s not in hay:
                continue
        out.append(
            {
                "id": str(r.id),
                "reviewType": "pharmacy",
                "pharmacyId": str(r.pharmacy_id),
                "pharmacyName": p.name if p else None,
                "userId": str(r.user_id),
                "userName": _user_label(u),
                "userEmail": u.email if u else None,
                "rating": int(r.rating),
                "comment": r.comment,
                "createdAt": r.created_at.isoformat() if r.created_at else "",
            }
        )
    return out


def list_admin_audits(
    *,
    actor_role: Optional[str] = None,
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    owner_id: Optional[str] = None,
    search: str = "",
    from_dt: Optional[str] = None,
    to_dt: Optional[str] = None,
    limit: int = 200,
) -> List[Dict[str, Any]]:
    qs = AuditEvent.objects.all().order_by("-created_at")
    if actor_role:
        qs = qs.filter(actor_role=str(actor_role))
    if action:
        qs = qs.filter(action=str(action))
    if resource_type:
        qs = qs.filter(resource_type=str(resource_type))
    if owner_id:
        qs = qs.filter(owner_id=str(owner_id))
    if from_dt:
        try:
            qs = qs.filter(created_at__gte=datetime.fromisoformat(from_dt))
        except ValueError:
            pass
    if to_dt:
        try:
            qs = qs.filter(created_at__lte=datetime.fromisoformat(to_dt))
        except ValueError:
            pass

    limit = max(1, min(int(limit or 200), 500))
    rows = list(qs[:limit])

    actor_ids = [ev.actor_user_id for ev in rows if ev.actor_user_id]
    user_map = {str(u.id): u for u in User.objects.filter(id__in=actor_ids)} if actor_ids else {}

    out: List[Dict[str, Any]] = []
    for ev in rows:
        actor = user_map.get(str(ev.actor_user_id)) if ev.actor_user_id else None
        actor_label = _user_label(actor) if actor else (str(ev.actor_user_id) if ev.actor_user_id else "—")
        item = {
            "id": str(ev.id),
            "createdAt": ev.created_at.isoformat() if ev.created_at else "",
            "actorRole": ev.actor_role if ev.actor_role in ("owner", "staff", "admin", "customer") else None,
            "actorUserId": str(ev.actor_user_id) if ev.actor_user_id else None,
            "actor": actor_label,
            "action": ev.action,
            "resourceType": ev.resource_type,
            "resourceId": ev.resource_id,
            "ownerId": ev.owner_id,
            "details": ev.details or "",
        }
        if search:
            s = search.strip().lower()
            hay = " ".join(
                [
                    item["actor"] or "",
                    item["action"] or "",
                    item["resourceType"] or "",
                    item["resourceId"] or "",
                    item["details"] or "",
                    item["ownerId"] or "",
                ]
            ).lower()
            if s not in hay:
                continue
        out.append(item)
    return out


def get_admin_analytics_dashboard(*, owner_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Admin analytics dashboard response.
    If owner_id is provided, drill down to that owner; otherwise platform-wide.
    """
    # KPI cards
    users_total = User.objects.count()
    pharmacies_total = Pharmacy.objects.count()
    products_total = MedicalProduct.objects.count()
    reservations_total = ProductReservation.objects.count()

    # Certificate pipeline
    cert_pending = Pharmacy.objects.filter(certificate_status="pending").count()
    cert_approved = Pharmacy.objects.filter(certificate_status="approved").count()
    cert_rejected = Pharmacy.objects.filter(certificate_status="rejected").count()

    # Monthly reservation trend (last 12 months)
    now = timezone.now()
    start = now - timedelta(days=365)
    res_qs = ProductReservation.objects.filter(created_at__gte=start)
    if owner_id:
        pharmacy_ids = list(Pharmacy.objects.filter(owner_id=str(owner_id)).values_list("id", flat=True))
        inventory_ids = list(
            PharmacyInventory.objects.filter(pharmacy_id__in=pharmacy_ids).values_list("id", flat=True)
        )
        res_qs = res_qs.filter(inventory_id__in=inventory_ids)
    monthly_rows = (
        res_qs.annotate(month=TruncMonth("created_at"))
        .values("month")
        .annotate(total=Count("id"))
        .order_by("month")
    )
    monthly_trend = [
        {"name": row["month"].strftime("%b") if row["month"] else "", "sales": float(row["total"])}
        for row in monthly_rows
    ]

    # Top products / categories: reuse existing helpers shape (name/value)
    top_products = (
        PharmacyInventory.objects.values("product_id")
        .annotate(total=Count("id"))
        .order_by("-total")[:5]
    )
    top_product_ids = [r["product_id"] for r in top_products]
    name_map = {p.id: p.name for p in MedicalProduct.objects.filter(id__in=top_product_ids)}
    top_products_out = [{"name": name_map.get(r["product_id"], r["product_id"]), "value": float(r["total"])} for r in top_products]

    top_categories = (
        MedicalProduct.objects.values("category_id")
        .annotate(total=Count("id"))
        .order_by("-total")[:8]
    )
    top_cat_ids = [r["category_id"] for r in top_categories]
    cat_map = {c.id: c.name for c in ProductCategory.objects.filter(id__in=top_cat_ids)}
    top_categories_out = [{"name": cat_map.get(r["category_id"], r["category_id"] or "Uncategorized"), "value": float(r["total"])} for r in top_categories]

    # Product views: detail-page engagement events (platform-wide or owner drill-down)
    views_qs = ProductPageEngagement.objects.all()
    if owner_id:
        pharmacy_ids = list(Pharmacy.objects.filter(owner_id=str(owner_id)).values_list("id", flat=True))
        product_ids = list(MedicalProduct.objects.filter(pharmacy_id__in=pharmacy_ids).values_list("id", flat=True))
        views_qs = views_qs.filter(product_id__in=product_ids)
    top_views = (
        views_qs.values("product_id")
        .annotate(total=Count("id"))
        .order_by("-total")[:8]
    )
    top_view_ids = [r["product_id"] for r in top_views]
    view_name_map = {p.id: p.name for p in MedicalProduct.objects.filter(id__in=top_view_ids)}
    top_product_views_out = [
        {"name": view_name_map.get(r["product_id"], r["product_id"]), "value": float(r["total"])}
        for r in top_views
    ]

    # Review distribution (platform-wide)
    review_counts = {i: 0 for i in range(1, 6)}
    for row in PharmacyReview.objects.values("rating").annotate(total=Count("id")):
        r = row["rating"]
        if r in review_counts:
            review_counts[r] += int(row["total"])
    for row in ProductReview.objects.values("rating").annotate(total=Count("id")):
        r = row["rating"]
        if r in review_counts:
            review_counts[r] += int(row["total"])
    review_distribution = [{"name": str(i), "value": float(review_counts[i])} for i in range(1, 6)]

    # Searches
    top_searches = (
        ProductSearch.objects.exclude(search_query__exact="")
        .values("search_query")
        .annotate(count=Count("id"))
        .order_by("-count")[:20]
    )
    top_searches_out = [{"query": r["search_query"], "count": int(r["count"])} for r in top_searches]
    no_result_searches = (
        ProductSearch.objects.filter(results_count=0)
        .exclude(search_query__exact="")
        .values("search_query")
        .annotate(count=Count("id"))
        .order_by("-count")[:25]
    )
    no_result_searches_out = [{"query": r["search_query"], "count": int(r["count"])} for r in no_result_searches]

    # Recent rows
    recent_users = list(User.objects.all().order_by("-created_at")[:10])
    recent_users_out = [
        {
            "id": str(u.id),
            "name": _user_label(u),
            "email": u.email,
            "role": u.role,
            "createdAt": u.created_at.isoformat() if u.created_at else "",
        }
        for u in recent_users
    ]
    recent_cert_submissions = list(
        Pharmacy.objects.exclude(certificate_submitted_at__isnull=True)
        .order_by("-certificate_submitted_at")[:10]
    )
    owner_map = {
        str(u.id): u for u in User.objects.filter(id__in=[p.owner_id for p in recent_cert_submissions])
    }
    recent_certs_out = [
        {
            "pharmacyId": str(p.id),
            "pharmacyName": p.name,
            "ownerId": str(p.owner_id),
            "ownerName": _user_label(owner_map.get(str(p.owner_id))),
            "certificateStatus": p.certificate_status,
            "submittedAt": p.certificate_submitted_at.isoformat() if p.certificate_submitted_at else None,
        }
        for p in recent_cert_submissions
    ]
    recent_audits = list(AuditEvent.objects.all().order_by("-created_at")[:20])
    recent_audits_out = list_admin_audits(limit=20)

    return {
        "kpis": {
            "usersTotal": users_total,
            "pharmaciesTotal": pharmacies_total,
            "productsTotal": products_total,
            "reservationsTotal": reservations_total,
        },
        "certificatePipeline": {
            "pending": cert_pending,
            "approved": cert_approved,
            "rejected": cert_rejected,
        },
        "monthlyReservations": monthly_trend,
        "topProducts": top_products_out,
        "topCategories": top_categories_out,
        "topProductViews": top_product_views_out,
        "reviewDistribution": review_distribution,
        "topSearches": {"items": top_searches_out},
        "noResultSearches": {"items": no_result_searches_out},
        "recentUsers": recent_users_out,
        "recentCertificateSubmissions": recent_certs_out,
        "recentAudits": {"items": recent_audits_out},
    }


def get_admin_analytics_reports(*, owner_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Reports: for now mirrors dashboard aggregates but supports optional ownerId drill down.
    """
    return get_admin_analytics_dashboard(owner_id=owner_id)

