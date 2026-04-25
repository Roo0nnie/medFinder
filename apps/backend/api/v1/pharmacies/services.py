"""
Pharmacy business logic and CRUD operations.
"""
import math
import mimetypes
import os
import uuid
from typing import Callable, Iterable, Optional

from django.conf import settings
from django.core.files.uploadedfile import UploadedFile
from django.db.models import FloatField, Q, QuerySet
from django.db.models.expressions import RawSQL
from django.utils import timezone

from .models import Pharmacy

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}
MAX_PHARMACY_IMAGE_BYTES = 5 * 1024 * 1024
MAX_CERTIFICATE_FILE_BYTES = 10 * 1024 * 1024
ALLOWED_CERTIFICATE_TYPES = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


def get_all_pharmacies(
    *,
    is_active: Optional[bool] = None,
    search_query: Optional[str] = None,
    city: Optional[str] = None,
    state: Optional[str] = None,
    north: Optional[float] = None,
    south: Optional[float] = None,
    east: Optional[float] = None,
    west: Optional[float] = None,
) -> QuerySet[Pharmacy]:
    qs = Pharmacy.objects.all()

    if is_active is not None:
        qs = qs.filter(is_active=is_active)

    if city:
        qs = qs.filter(city__iexact=city)

    if state:
        qs = qs.filter(state__iexact=state)

    if search_query:
        search_query = search_query.strip()
        qs = qs.filter(
            Q(name__icontains=search_query)
            | Q(description__icontains=search_query)
            | Q(address__icontains=search_query)
            | Q(city__icontains=search_query)
            | Q(state__icontains=search_query)
        )

    if (
        north is not None
        and south is not None
        and east is not None
        and west is not None
        and north >= south
    ):
        qs = qs.filter(
            latitude__isnull=False,
            longitude__isnull=False,
            latitude__gte=south,
            latitude__lte=north,
        )
        if west <= east:
            qs = qs.filter(longitude__gte=west, longitude__lte=east)
        else:
            # Viewport crosses the antimeridian (rare); OR the two longitude spans.
            qs = qs.filter(Q(longitude__gte=west) | Q(longitude__lte=east))

    return qs.order_by("-updated_at")


def find_nearest_pharmacies(
    *,
    lat: float,
    lng: float,
    radius_km: float = 25.0,
    limit: int = 20,
) -> QuerySet[Pharmacy]:
    """
    Approved, active pharmacies within radius_km of (lat, lng), ordered by Haversine distance (km).
    Uses a latitude/longitude bounding-box prefilter before Haversine for index use.
    """
    if limit < 1:
        limit = 1
    if limit > 100:
        limit = 100
    radius_km = max(0.5, min(radius_km, 500.0))

    deg = radius_km / 111.0
    cos_lat = max(0.0001, math.cos(math.radians(lat)))
    lat_min, lat_max = lat - deg, lat + deg
    lng_delta = deg / cos_lat
    lng_min, lng_max = lng - lng_delta, lng + lng_delta

    distance_sql = (
        "6371 * acos(GREATEST(-1.0, LEAST(1.0, "
        "cos(radians(%s)) * cos(radians(latitude)) * cos(radians(longitude) - radians(%s)) + "
        "sin(radians(%s)) * sin(radians(latitude)))))"
    )

    return (
        Pharmacy.objects.filter(
            is_active=True,
            certificate_status="approved",
            latitude__isnull=False,
            longitude__isnull=False,
            latitude__gte=lat_min,
            latitude__lte=lat_max,
            longitude__gte=lng_min,
            longitude__lte=lng_max,
        )
        .annotate(
            distance=RawSQL(distance_sql, [lat, lng, lat], output_field=FloatField()),
        )
        .filter(distance__lte=radius_km)
        .order_by("distance")[:limit]
    )


def get_pharmacy_by_id(pk: str) -> Pharmacy:
    return Pharmacy.objects.get(pk=pk)


def get_pharmacies_by_owner(owner_id: str) -> Iterable[Pharmacy]:
    return Pharmacy.objects.filter(owner_id=owner_id).order_by("-updated_at")


def create_pharmacy(
    *,
    owner_id: str,
    name: str,
    description: Optional[str] = None,
    address: str,
    city: str,
    state: str,
    zip_code: str,
    country: str = "US",
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    phone: Optional[str] = None,
    email: Optional[str] = None,
    website: Optional[str] = None,
    operating_hours: Optional[str] = None,
    logo: Optional[str] = None,
    owner_image: Optional[str] = None,
    google_map_embed: Optional[str] = None,
    social_links: Optional[str] = None,
) -> Pharmacy:
    now = timezone.now()
    pharmacy_id = str(uuid.uuid4())
    return Pharmacy.objects.create(
        id=pharmacy_id,
        owner_id=owner_id,
        name=name,
        description=description or "",
        address=address,
        city=city,
        state=state,
        zip_code=zip_code,
        country=country or "US",
        latitude=latitude,
        longitude=longitude,
        phone=phone or "",
        email=email or "",
        website=website or "",
        operating_hours=operating_hours or "",
        logo=logo or "",
        owner_image=owner_image or "",
        google_map_embed=google_map_embed or "",
        social_links=social_links or "",
        is_active=True,
        created_at=now,
        updated_at=now,
    )


def update_pharmacy(
    pk: str,
    *,
    name: Optional[str] = None,
    description: Optional[str] = None,
    address: Optional[str] = None,
    city: Optional[str] = None,
    state: Optional[str] = None,
    zip_code: Optional[str] = None,
    country: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    phone: Optional[str] = None,
    email: Optional[str] = None,
    website: Optional[str] = None,
    operating_hours: Optional[str] = None,
    is_active: Optional[bool] = None,
    logo: Optional[str] = None,
    owner_image: Optional[str] = None,
    certificate_file_url: Optional[str] = None,
    certificate_number: Optional[str] = None,
    certificate_status: Optional[str] = None,
    certificate_submitted_at=None,
    certificate_reviewed_at=None,
    certificate_reviewed_by: Optional[str] = None,
    certificate_review_note: Optional[str] = None,
    google_map_embed: Optional[str] = None,
    social_links: Optional[str] = None,
) -> Pharmacy:
    pharmacy = Pharmacy.objects.get(pk=pk)
    update_fields: list[str] = []

    if name is not None:
        pharmacy.name = name
        update_fields.append("name")
    if description is not None:
        pharmacy.description = description
        update_fields.append("description")
    if address is not None:
        pharmacy.address = address
        update_fields.append("address")
    if city is not None:
        pharmacy.city = city
        update_fields.append("city")
    if state is not None:
        pharmacy.state = state
        update_fields.append("state")
    if zip_code is not None:
        pharmacy.zip_code = zip_code
        update_fields.append("zip_code")
    if country is not None:
        pharmacy.country = country
        update_fields.append("country")
    if latitude is not None:
        pharmacy.latitude = latitude
        update_fields.append("latitude")
    if longitude is not None:
        pharmacy.longitude = longitude
        update_fields.append("longitude")
    if phone is not None:
        pharmacy.phone = phone
        update_fields.append("phone")
    if email is not None:
        pharmacy.email = email
        update_fields.append("email")
    if website is not None:
        pharmacy.website = website
        update_fields.append("website")
    if operating_hours is not None:
        pharmacy.operating_hours = operating_hours
        update_fields.append("operating_hours")
    if is_active is not None:
        pharmacy.is_active = is_active
        update_fields.append("is_active")
    if logo is not None:
        pharmacy.logo = logo
        update_fields.append("logo")
    if owner_image is not None:
        pharmacy.owner_image = owner_image
        update_fields.append("owner_image")
    if certificate_file_url is not None:
        pharmacy.certificate_file_url = certificate_file_url
        update_fields.append("certificate_file_url")
    if certificate_number is not None:
        pharmacy.certificate_number = certificate_number
        update_fields.append("certificate_number")
    if certificate_status is not None:
        pharmacy.certificate_status = certificate_status
        update_fields.append("certificate_status")
    if certificate_submitted_at is not None:
        pharmacy.certificate_submitted_at = certificate_submitted_at
        update_fields.append("certificate_submitted_at")
    if certificate_reviewed_at is not None:
        pharmacy.certificate_reviewed_at = certificate_reviewed_at
        update_fields.append("certificate_reviewed_at")
    if certificate_reviewed_by is not None:
        pharmacy.certificate_reviewed_by = certificate_reviewed_by
        update_fields.append("certificate_reviewed_by")
    if certificate_review_note is not None:
        pharmacy.certificate_review_note = certificate_review_note
        update_fields.append("certificate_review_note")
    if google_map_embed is not None:
        pharmacy.google_map_embed = google_map_embed
        update_fields.append("google_map_embed")
    if social_links is not None:
        pharmacy.social_links = social_links
        update_fields.append("social_links")

    pharmacy.updated_at = timezone.now()
    update_fields.append("updated_at")

    pharmacy.save(update_fields=update_fields)
    return pharmacy


def delete_pharmacy(pk: str) -> dict:
    pharmacy = Pharmacy.objects.get(pk=pk)
    pharmacy.delete()
    return {"success": True, "id": str(pk)}


def _remove_old_media_file_if_ours(old_url: Optional[str], pharmacy_id: str) -> None:
    if not old_url:
        return
    marker = "/media/"
    if marker not in old_url:
        return
    rel = old_url.split(marker, 1)[1].split("?", 1)[0].strip()
    prefix = f"pharmacies/{pharmacy_id}/"
    if not rel.startswith(prefix):
        return
    abs_path = os.path.join(settings.MEDIA_ROOT, rel.replace("/", os.sep))
    if os.path.isfile(abs_path):
        try:
            os.remove(abs_path)
        except OSError:
            pass


def save_pharmacy_image_upload(
    *,
    pharmacy_id: str,
    kind: str,
    uploaded_file: UploadedFile,
    build_absolute_uri: Callable[[str], str],
) -> Pharmacy:
    """
    Persist an image to MEDIA_ROOT, update logo or owner_image URL, return updated pharmacy.
    `build_absolute_uri` is typically request.build_absolute_uri bound to a path starting with /.
    """
    if kind not in ("logo", "owner"):
        raise ValueError("kind must be logo or owner")

    content_type = (uploaded_file.content_type or "").split(";")[0].strip().lower()
    ext = ALLOWED_IMAGE_TYPES.get(content_type)
    if not ext and uploaded_file.name:
        guessed, _ = mimetypes.guess_type(uploaded_file.name)
        if guessed:
            ext = ALLOWED_IMAGE_TYPES.get(guessed.lower())
    if not ext:
        raise ValueError(
            "Unsupported image type. Use JPEG, PNG, WebP, or GIF."
        )

    size = getattr(uploaded_file, "size", None) or 0
    if size > MAX_PHARMACY_IMAGE_BYTES:
        raise ValueError("Image must be 5 MB or smaller.")

    pharmacy = get_pharmacy_by_id(pharmacy_id)
    old_url = pharmacy.logo if kind == "logo" else pharmacy.owner_image
    _remove_old_media_file_if_ours(old_url or None, pharmacy_id)

    name = "logo" if kind == "logo" else "owner"
    rel_path = f"pharmacies/{pharmacy_id}/{name}{ext}"
    abs_fs = os.path.join(settings.MEDIA_ROOT, rel_path.replace("/", os.sep))
    os.makedirs(os.path.dirname(abs_fs), exist_ok=True)

    with open(abs_fs, "wb") as dest:
        for chunk in uploaded_file.chunks():
            dest.write(chunk)

    url_path = f"{settings.MEDIA_URL.rstrip('/')}/{rel_path}"
    absolute_url = build_absolute_uri(url_path)

    if kind == "logo":
        return update_pharmacy(pharmacy_id, logo=absolute_url)
    return update_pharmacy(pharmacy_id, owner_image=absolute_url)


def _remove_old_certificate_file_if_ours(old_url: Optional[str], pharmacy_id: str) -> None:
    if not old_url:
        return
    marker = "/media/"
    if marker not in old_url:
        return
    rel = old_url.split(marker, 1)[1].split("?", 1)[0].strip()
    prefix = f"pharmacies/{pharmacy_id}/certificate"
    if not rel.startswith(prefix):
        return
    abs_path = os.path.join(settings.MEDIA_ROOT, rel.replace("/", os.sep))
    if os.path.isfile(abs_path):
        try:
            os.remove(abs_path)
        except OSError:
            pass


def save_pharmacy_certificate_upload(
    *,
    pharmacy_id: str,
    certificate_number: str,
    uploaded_file: UploadedFile,
    build_absolute_uri: Callable[[str], str],
) -> Pharmacy:
    content_type = (uploaded_file.content_type or "").split(";")[0].strip().lower()
    ext = ALLOWED_CERTIFICATE_TYPES.get(content_type)
    if not ext and uploaded_file.name:
        guessed, _ = mimetypes.guess_type(uploaded_file.name)
        if guessed:
            ext = ALLOWED_CERTIFICATE_TYPES.get(guessed.lower())
    if not ext:
        raise ValueError("Unsupported certificate type. Use PDF, JPEG, PNG, or WebP.")

    size = getattr(uploaded_file, "size", None) or 0
    if size > MAX_CERTIFICATE_FILE_BYTES:
        raise ValueError("Certificate file must be 10 MB or smaller.")

    pharmacy = get_pharmacy_by_id(pharmacy_id)
    _remove_old_certificate_file_if_ours(pharmacy.certificate_file_url or None, pharmacy_id)

    rel_path = f"pharmacies/{pharmacy_id}/certificate{ext}"
    abs_fs = os.path.join(settings.MEDIA_ROOT, rel_path.replace("/", os.sep))
    os.makedirs(os.path.dirname(abs_fs), exist_ok=True)

    with open(abs_fs, "wb") as dest:
        for chunk in uploaded_file.chunks():
            dest.write(chunk)

    url_path = f"{settings.MEDIA_URL.rstrip('/')}/{rel_path}"
    absolute_url = build_absolute_uri(url_path)

    pharmacy.certificate_file_url = absolute_url
    pharmacy.certificate_number = certificate_number.strip()
    pharmacy.certificate_status = "pending"
    pharmacy.certificate_submitted_at = timezone.now()
    pharmacy.certificate_reviewed_at = None
    pharmacy.certificate_reviewed_by = None
    pharmacy.certificate_review_note = None
    pharmacy.updated_at = timezone.now()
    pharmacy.save(
        update_fields=[
            "certificate_file_url",
            "certificate_number",
            "certificate_status",
            "certificate_submitted_at",
            "certificate_reviewed_at",
            "certificate_reviewed_by",
            "certificate_review_note",
            "updated_at",
        ]
    )
    return pharmacy


def review_pharmacy_certificate(
    *,
    pharmacy_id: str,
    reviewer_id: str,
    status: str,
    review_note: Optional[str] = None,
) -> Pharmacy:
    if status not in ("approved", "rejected"):
        raise ValueError("status must be approved or rejected")
    return update_pharmacy(
        pharmacy_id,
        certificate_status=status,
        certificate_reviewed_at=timezone.now(),
        certificate_reviewed_by=reviewer_id,
        certificate_review_note=(review_note or "").strip(),
    )


def search_pharmacies(
    *,
    query: Optional[str] = None,
    city: Optional[str] = None,
    state: Optional[str] = None,
    is_active: Optional[bool] = True,
) -> QuerySet[Pharmacy]:
    return get_all_pharmacies(
        is_active=is_active,
        search_query=query,
        city=city,
        state=state,
    )

