"""
GET /api/v1/products/?query=... logs a ProductSearch analytics row.
"""
from django.core.cache import cache
from rest_framework.test import APITestCase

from api.v1.products.models import ProductSearch

from .factories import login, make_pharmacy, make_product, make_user


class SearchLoggingTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.owner = make_user("owner")
        pharmacy = make_pharmacy(self.owner)
        make_product(pharmacy=pharmacy, name="Advil", generic_name="Ibuprofen")
        make_product(pharmacy=pharmacy, name="Claritin", generic_name="Loratadine")

    def test_anonymous_search_is_logged_with_result_count_and_matched_owner(self):
        res = self.client.get("/api/v1/products/", {"query": "ibuprofen"})

        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.json()), 1)
        event = ProductSearch.objects.get()
        self.assertEqual(event.search_query, "ibuprofen")
        self.assertEqual(event.results_count, 1)
        self.assertEqual(event.matched_owner_ids, [str(self.owner.id)])
        self.assertIsNone(event.customer_id)

    def test_zero_result_search_is_logged(self):
        self.client.get("/api/v1/products/", {"query": "nonexistentdrug"})

        event = ProductSearch.objects.get()
        self.assertEqual(event.results_count, 0)
        self.assertEqual(event.matched_owner_ids, [])

    def test_authenticated_search_records_customer_id(self):
        customer = make_user("customer")
        login(self.client, customer)

        self.client.get("/api/v1/products/", {"query": "loratadine"})

        self.assertEqual(ProductSearch.objects.get().customer_id, str(customer.id))

    def test_listing_without_query_is_not_logged(self):
        res = self.client.get("/api/v1/products/")

        self.assertEqual(res.status_code, 200)
        self.assertFalse(ProductSearch.objects.exists())
