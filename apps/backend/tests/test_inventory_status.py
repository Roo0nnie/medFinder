"""
Stock status rules in api.v1.analytics.services.

- _stock_status (staff dashboard rows): out / unavailable / low / ok
- get_owner_stats (owner dashboard cards): in-stock / low / out counts, using
  the product's low_stock_threshold or 5 when it is null.
"""
from django.test import SimpleTestCase, TestCase

from api.v1.analytics.services import _stock_status, get_owner_stats

from .factories import make_inventory, make_pharmacy, make_product, make_user


class StockStatusTests(SimpleTestCase):
    def test_zero_quantity_is_out_even_when_unavailable(self):
        self.assertEqual(_stock_status(quantity=0, stock_limit=5, is_available=True), "out")
        self.assertEqual(_stock_status(quantity=0, stock_limit=5, is_available=False), "out")

    def test_unavailable_with_stock_is_unavailable(self):
        self.assertEqual(_stock_status(quantity=50, stock_limit=5, is_available=False), "unavailable")

    def test_low_threshold_is_inclusive(self):
        self.assertEqual(_stock_status(quantity=5, stock_limit=5, is_available=True), "low")
        self.assertEqual(_stock_status(quantity=1, stock_limit=5, is_available=True), "low")
        self.assertEqual(_stock_status(quantity=6, stock_limit=5, is_available=True), "ok")


class OwnerStockCountsTests(TestCase):
    def test_counts_use_product_threshold_or_default_of_five(self):
        owner = make_user("owner")
        other_owner = make_user("owner")
        pharmacy = make_pharmacy(owner)
        default_threshold = make_product(pharmacy=pharmacy, name="Default threshold")  # null -> 5
        custom_threshold = make_product(pharmacy=pharmacy, name="Custom", low_stock_threshold=20)

        make_inventory(pharmacy, default_threshold, quantity=0)  # out
        make_inventory(pharmacy, default_threshold, quantity=5)  # low (5 <= 5)
        make_inventory(pharmacy, default_threshold, quantity=6)  # in stock
        make_inventory(pharmacy, custom_threshold, quantity=20)  # low (20 <= 20)
        make_inventory(pharmacy, custom_threshold, quantity=21)  # in stock
        # Another owner's stock must not be counted.
        other_pharmacy = make_pharmacy(other_owner)
        make_inventory(other_pharmacy, make_product(pharmacy=other_pharmacy), quantity=0)

        stats = get_owner_stats(str(owner.id))

        self.assertEqual(stats["inventoryOutOfStockCount"], 1)
        self.assertEqual(stats["inventoryLowStockCount"], 2)
        self.assertEqual(stats["inventoryInStockCount"], 2)
