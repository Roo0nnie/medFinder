"""
Small factory helpers for backend tests.

They write rows through the same Django models the API uses. Authentication
goes through the real BetterAuthSessionAuthentication path: ``login`` inserts a
row into ``sessions`` and sets the Better Auth cookie on the test client.
"""
import uuid
from datetime import timedelta
from decimal import Decimal

from django.utils import timezone

from api.v1.inventory.models import PharmacyInventory
from api.v1.pharmacies.models import Pharmacy, PharmacyStaff
from api.v1.products.models import MedicalProduct, MedicalProductVariant, ProductCategory
from api.v1.staff.models import Staff
from api.v1.users.models import BetterAuthSession, User


def _id() -> str:
    return str(uuid.uuid4())


def make_user(role: str = "customer", **fields) -> User:
    now = timezone.now()
    uid = fields.pop("id", _id())
    return User.objects.create(
        id=uid,
        email=fields.pop("email", f"{role}-{uid[:8]}@example.test"),
        last_name=fields.pop("last_name", role.title()),
        role=role,
        created_at=now,
        updated_at=now,
        **fields,
    )


def login(client, user: User) -> None:
    """Create a Better Auth session row and attach its cookie to ``client``."""
    now = timezone.now()
    token = uuid.uuid4().hex
    BetterAuthSession.objects.create(
        id=_id(),
        token=token,
        user=user,
        expires_at=now + timedelta(days=1),
        created_at=now,
        updated_at=now,
    )
    # Real cookies carry a ".signature" suffix; the authenticator strips it.
    client.cookies["better-auth.session_token"] = f"{token}.signature"


def make_pharmacy(owner: User, *, approved: bool = True, is_active: bool = True, **fields) -> Pharmacy:
    now = timezone.now()
    return Pharmacy.objects.create(
        id=fields.pop("id", _id()),
        owner_id=str(owner.id),
        name=fields.pop("name", "Test Pharmacy"),
        address=fields.pop("address", "1 Main St"),
        city=fields.pop("city", "Springfield"),
        state=fields.pop("state", "IL"),
        zip_code=fields.pop("zip_code", "00000"),
        certificate_status="approved" if approved else "pending",
        is_active=is_active,
        created_at=now,
        updated_at=now,
        **fields,
    )


def make_staff(user: User, owner: User, *, pharmacy: Pharmacy | None = None) -> Staff:
    now = timezone.now()
    staff = Staff.objects.create(
        id=_id(),
        user_id=str(user.id),
        owner_id=str(owner.id),
        department="Pharmacy",
        position="Assistant",
        created_at=now,
        updated_at=now,
    )
    if pharmacy is not None:
        PharmacyStaff.objects.create(
            id=_id(), pharmacy_id=pharmacy.id, staff_id=staff.id, assigned_at=now
        )
    return staff


def make_category(owner: User, **fields) -> ProductCategory:
    now = timezone.now()
    return ProductCategory.objects.create(
        id=fields.pop("id", _id()),
        owner_id=str(owner.id),
        name=fields.pop("name", "General"),
        created_at=now,
        updated_at=now,
        **fields,
    )


def make_product(*, pharmacy: Pharmacy | None = None, category_id: str = "cat", **fields) -> MedicalProduct:
    now = timezone.now()
    return MedicalProduct.objects.create(
        id=fields.pop("id", _id()),
        pharmacy_id=pharmacy.id if pharmacy else None,
        name=fields.pop("name", "Product"),
        category_id=category_id,
        created_at=now,
        updated_at=now,
        **fields,
    )


def make_variant(product: MedicalProduct, **fields) -> MedicalProductVariant:
    now = timezone.now()
    return MedicalProductVariant.objects.create(
        id=fields.pop("id", _id()),
        product_id=product.id,
        label=fields.pop("label", "Default"),
        unit=fields.pop("unit", "piece"),
        created_at=now,
        updated_at=now,
        **fields,
    )


def make_inventory(pharmacy: Pharmacy, product: MedicalProduct, *, quantity: int = 10, **fields) -> PharmacyInventory:
    now = timezone.now()
    return PharmacyInventory.objects.create(
        id=fields.pop("id", _id()),
        pharmacy_id=pharmacy.id,
        product_id=product.id,
        quantity=quantity,
        price=fields.pop("price", Decimal("9.99")),
        created_at=now,
        updated_at=now,
        **fields,
    )
