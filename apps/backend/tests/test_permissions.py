"""
Role-based access for the product, inventory and pharmacy endpoints.

Requests authenticate through the real Better Auth session cookie path.
Status codes are the ones the code produces today: DRF permission failures
return 403 for both anonymous and authenticated users (the custom
authenticator does not define authenticate_header, so there is no 401).
"""
from django.core.cache import cache
from rest_framework.test import APITestCase

from api.v1.inventory.models import PharmacyInventory
from api.v1.pharmacies.models import Pharmacy
from api.v1.products.models import MedicalProduct

from .factories import (
    login,
    make_category,
    make_inventory,
    make_pharmacy,
    make_product,
    make_staff,
    make_user,
)


class RoleFixtureMixin:
    """Two owners, each with one approved pharmacy and one product, plus staff/customer/admin."""

    def setUp(self):
        cache.clear()
        self.owner_a = make_user("owner")
        self.owner_b = make_user("owner")
        self.customer = make_user("customer")
        self.admin = make_user("admin")
        self.staff_a_user = make_user("staff")

        self.pharmacy_a = make_pharmacy(self.owner_a, name="Pharmacy A")
        self.pharmacy_b = make_pharmacy(self.owner_b, name="Pharmacy B")
        make_staff(self.staff_a_user, self.owner_a, pharmacy=self.pharmacy_a)

        self.category_a = make_category(self.owner_a)
        self.product_a = make_product(pharmacy=self.pharmacy_a, name="Product A", category_id=self.category_a.id)
        self.product_b = make_product(pharmacy=self.pharmacy_b, name="Product B", category_id=self.category_a.id)
        self.inventory_a = make_inventory(self.pharmacy_a, self.product_a)
        self.inventory_b = make_inventory(self.pharmacy_b, self.product_b)

    def as_user(self, user):
        self.client.cookies.clear()
        if user is not None:
            login(self.client, user)


class ProductAccessTests(RoleFixtureMixin, APITestCase):
    url = "/api/v1/products/manage/"

    def create_payload(self, pharmacy):
        return {
            "pharmacyId": pharmacy.id,
            "name": "New Product",
            "categoryId": self.category_a.id,
            "variantLabel": "Box of 10",
            "unit": "box",
            "quantity": 3,
            "price": "5.00",
        }

    def test_anonymous_customer_and_staff_cannot_create_products(self):
        for user in (None, self.customer, self.staff_a_user):
            with self.subTest(role=getattr(user, "role", "anonymous")):
                self.as_user(user)
                res = self.client.post(self.url, self.create_payload(self.pharmacy_a), format="json")
                self.assertEqual(res.status_code, 403)
        self.assertFalse(MedicalProduct.objects.filter(name="New Product").exists())

    def test_owner_can_create_product_for_own_pharmacy(self):
        self.as_user(self.owner_a)
        res = self.client.post(self.url, self.create_payload(self.pharmacy_a), format="json")

        self.assertEqual(res.status_code, 201, res.content)
        product = MedicalProduct.objects.get(name="New Product")
        self.assertEqual(product.pharmacy_id, self.pharmacy_a.id)
        # Creating a product also creates its first inventory row.
        self.assertTrue(PharmacyInventory.objects.filter(product_id=product.id, quantity=3).exists())

    def test_owner_cannot_create_product_for_another_owners_pharmacy(self):
        self.as_user(self.owner_a)
        res = self.client.post(self.url, self.create_payload(self.pharmacy_b), format="json")

        self.assertEqual(res.status_code, 403)

    def test_admin_can_create_product_for_any_pharmacy(self):
        self.as_user(self.admin)
        res = self.client.post(self.url, self.create_payload(self.pharmacy_b), format="json")

        self.assertEqual(res.status_code, 201, res.content)

    def test_owner_cannot_update_or_delete_another_owners_product(self):
        self.as_user(self.owner_a)
        url = f"/api/v1/products/manage/{self.product_b.id}/"

        self.assertEqual(self.client.put(url, {"name": "Hijacked"}, format="json").status_code, 403)
        self.assertEqual(self.client.delete(url).status_code, 403)
        self.product_b.refresh_from_db()
        self.assertEqual(self.product_b.name, "Product B")

    def test_product_list_is_scoped_by_role(self):
        unapproved = make_pharmacy(self.owner_b, approved=False, name="Pending Pharmacy")
        make_product(pharmacy=unapproved, name="Product Pending", category_id=self.category_a.id)

        expected = {
            None: ["Product A", "Product B"],  # approved pharmacies only
            self.customer: ["Product A", "Product B"],
            self.owner_a: ["Product A"],  # own pharmacies only
            self.owner_b: ["Product B", "Product Pending"],
            self.staff_a_user: ["Product A"],  # their owner's pharmacies
            self.admin: ["Product A", "Product B", "Product Pending"],
        }
        for user, names in expected.items():
            with self.subTest(role=getattr(user, "role", "anonymous")):
                self.as_user(user)
                res = self.client.get("/api/v1/products/")
                self.assertEqual(res.status_code, 200)
                self.assertEqual(sorted(p["name"] for p in res.json()), names)


class InventoryAccessTests(RoleFixtureMixin, APITestCase):
    url = "/api/v1/inventory/"

    def payload(self, pharmacy, product):
        return {"pharmacyId": pharmacy.id, "productId": product.id, "quantity": 7, "price": "4.50"}

    def test_anonymous_and_customer_cannot_create_inventory(self):
        for user in (None, self.customer):
            with self.subTest(role=getattr(user, "role", "anonymous")):
                self.as_user(user)
                res = self.client.post(self.url, self.payload(self.pharmacy_a, self.product_a), format="json")
                self.assertEqual(res.status_code, 403)

    def test_staff_can_create_inventory_only_for_their_owners_pharmacies(self):
        self.as_user(self.staff_a_user)

        ok = self.client.post(self.url, self.payload(self.pharmacy_a, self.product_a), format="json")
        denied = self.client.post(self.url, self.payload(self.pharmacy_b, self.product_b), format="json")

        self.assertEqual(ok.status_code, 201, ok.content)
        self.assertEqual(denied.status_code, 403)

    def test_owner_cannot_modify_another_owners_inventory(self):
        self.as_user(self.owner_a)
        url = f"{self.url}{self.inventory_b.id}/"

        self.assertEqual(self.client.put(url, {"quantity": 0}, format="json").status_code, 403)
        self.assertEqual(self.client.delete(url).status_code, 403)
        self.inventory_b.refresh_from_db()
        self.assertEqual(self.inventory_b.quantity, 10)

    def test_owner_can_update_own_inventory(self):
        self.as_user(self.owner_a)
        res = self.client.put(f"{self.url}{self.inventory_a.id}/", {"quantity": 2}, format="json")

        self.assertEqual(res.status_code, 200, res.content)
        self.inventory_a.refresh_from_db()
        self.assertEqual(self.inventory_a.quantity, 2)

    def test_inventory_list_excludes_other_owners_rows(self):
        self.as_user(self.owner_a)
        res = self.client.get(self.url)

        self.assertEqual(res.status_code, 200)
        self.assertEqual([row["id"] for row in res.json()], [self.inventory_a.id])


class PharmacyAccessTests(RoleFixtureMixin, APITestCase):
    create_url = "/api/v1/pharmacies/create/"
    create_payload = {"name": "New Branch", "address": "2 Side St", "city": "Shelbyville", "state": "IL", "zipCode": "11111"}

    def test_customer_and_staff_cannot_create_pharmacies(self):
        for user in (None, self.customer, self.staff_a_user):
            with self.subTest(role=getattr(user, "role", "anonymous")):
                self.as_user(user)
                res = self.client.post(self.create_url, self.create_payload, format="json")
                self.assertEqual(res.status_code, 403)
        self.assertFalse(Pharmacy.objects.filter(name="New Branch").exists())

    def test_owner_creates_pharmacy_owned_by_themselves(self):
        self.as_user(self.owner_a)
        res = self.client.post(self.create_url, self.create_payload, format="json")

        self.assertEqual(res.status_code, 201, res.content)
        self.assertEqual(Pharmacy.objects.get(name="New Branch").owner_id, str(self.owner_a.id))

    def test_owner_cannot_update_or_delete_another_owners_pharmacy(self):
        self.as_user(self.owner_a)
        url = f"/api/v1/pharmacies/{self.pharmacy_b.id}/"

        self.assertEqual(self.client.put(url, {"name": "Hijacked"}, format="json").status_code, 403)
        self.assertEqual(self.client.delete(url).status_code, 403)
        self.pharmacy_b.refresh_from_db()
        self.assertEqual(self.pharmacy_b.name, "Pharmacy B")

    def test_pharmacy_list_hides_unapproved_from_non_admins(self):
        make_pharmacy(self.owner_a, approved=False, name="Pending Pharmacy")

        for user in (None, self.customer, self.owner_a):
            with self.subTest(role=getattr(user, "role", "anonymous")):
                self.as_user(user)
                names = sorted(p["name"] for p in self.client.get("/api/v1/pharmacies/").json())
                self.assertEqual(names, ["Pharmacy A", "Pharmacy B"])

        self.as_user(self.admin)
        names = sorted(p["name"] for p in self.client.get("/api/v1/pharmacies/").json())
        self.assertEqual(names, ["Pending Pharmacy", "Pharmacy A", "Pharmacy B"])

    def test_my_pharmacies_returns_only_own_pharmacies(self):
        for user, expected in ((self.owner_a, ["Pharmacy A"]), (self.owner_b, ["Pharmacy B"]), (self.staff_a_user, ["Pharmacy A"])):
            with self.subTest(role=user.role, user=user.id):
                self.as_user(user)
                res = self.client.get("/api/v1/pharmacies/my-pharmacies/")
                self.assertEqual(res.status_code, 200)
                self.assertEqual([p["name"] for p in res.json()], expected)

    def test_only_admin_can_review_certificates(self):
        pending = make_pharmacy(self.owner_a, approved=False, name="Pending Pharmacy")
        url = f"/api/v1/pharmacies/{pending.id}/certificate/review/"

        for user in (self.customer, self.staff_a_user, self.owner_a):
            with self.subTest(role=user.role):
                self.as_user(user)
                self.assertEqual(self.client.post(url, {"status": "approved"}, format="json").status_code, 403)

        self.as_user(self.admin)
        res = self.client.post(url, {"status": "approved"}, format="json")
        self.assertEqual(res.status_code, 200, res.content)
        pending.refresh_from_db()
        self.assertEqual(pending.certificate_status, "approved")
