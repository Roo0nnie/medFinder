"""
Pharmacy business logic and CRUD operations.
"""
import uuid
from typing import Iterable, Optional

from django.db.models import Q, QuerySet
from django.utils import timezone

from .models import Pharmacy


def get_all_pharmacies(
    *,
    is_active: Optional[bool] = None,
    search_query: Optional[str] = None,
    city: Optional[str] = None,
    state: Optional[str] = None,
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

    return qs.order_by("-updated_at")


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

