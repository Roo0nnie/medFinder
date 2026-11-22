"""
Product search: weighted full-text search, SearchRank ordering and the
short-token substring fallback in ``api.v1.products.services.list_products``.

These run against real PostgreSQL because they depend on to_tsvector /
plainto_tsquery / ts_rank behaviour.
"""
from django.test import TestCase

from api.v1.products.services import list_products

from .factories import make_product, make_variant


def names(qs):
    return [p.name for p in qs]


class WeightedRankingTests(TestCase):
    def test_generic_name_match_outranks_description_only_match(self):
        make_product(name="Pain Relief Tablets", description="Each tablet contains ibuprofen.")
        make_product(name="Advil", generic_name="Ibuprofen")

        results = list(list_products(query="ibuprofen"))

        self.assertEqual(names(results), ["Advil", "Pain Relief Tablets"])
        self.assertGreater(results[0].rank, results[1].rank)

    def test_brand_name_match_is_found(self):
        make_product(name="Paracetamol 500", generic_name="Paracetamol", brand_name="Biogesic")
        make_product(name="Unrelated", generic_name="Loratadine")

        self.assertEqual(names(list_products(query="biogesic")), ["Paracetamol 500"])

    def test_search_synonym_finds_product(self):
        # The query term appears only in search_synonyms.
        make_product(name="Paracetamol 500", generic_name="Paracetamol", search_synonyms="acetaminophen tylenol")
        make_product(name="Unrelated", generic_name="Loratadine")

        results = list(list_products(query="acetaminophen"))

        self.assertEqual(names(results), ["Paracetamol 500"])
        self.assertGreater(results[0].rank, 0)
        self.assertEqual(results[0].search_bucket, 0)


class SubstringFallbackTests(TestCase):
    def test_short_single_token_falls_back_to_substring_when_fts_misses(self):
        # "gesic" is not a lexeme in "analgesic", so FTS alone finds nothing.
        make_product(name="Mefenamic Acid", indications="Analgesic for mild to moderate pain")

        results = list(list_products(query="gesic"))

        self.assertEqual(names(results), ["Mefenamic Acid"])
        self.assertEqual(results[0].search_bucket, 1)
        self.assertEqual(results[0].rank, 0)

    def test_fallback_results_come_after_fts_matches(self):
        make_product(name="Fluconazole 150", generic_name="Fluconazole")  # substring only
        make_product(name="Cold Remedy", search_synonyms="flu cold")  # FTS hit

        results = list(list_products(query="flu"))

        self.assertEqual(names(results), ["Cold Remedy", "Fluconazole 150"])
        self.assertEqual([p.search_bucket for p in results], [0, 1])

    def test_fallback_disabled_for_tokens_longer_than_six_characters(self):
        make_product(name="Mefenamic Acid", indications="Analgesic for mild to moderate pain")

        self.assertEqual(names(list_products(query="algesic")), [])  # 7 chars

    def test_fallback_disabled_for_multi_token_queries(self):
        make_product(name="Mefenamic Acid", indications="Analgesic for mild to moderate pain")

        # Neither word is a lexeme in the product text, and the substring fallback
        # only applies to single-token queries.
        self.assertEqual(names(list_products(query="gesic relief")), [])

    def test_variant_fields_match_regardless_of_query_length(self):
        product = make_product(name="Amoxicillin")
        make_variant(product, label="250mg/5mL", dosage_form="Suspension", strength="250mg/5mL")
        make_product(name="Unrelated")

        # 10 characters: product-text fallback is off, variant fallback still applies.
        results = list(list_products(query="suspension"))

        self.assertEqual(names(results), ["Amoxicillin"])
        self.assertEqual(results[0].search_bucket, 1)



class MultiWordQueryTests(TestCase):
    """Regression: ts_rank returns 1e-20 for non-matching multi-term queries,
    so filtering on rank > 0 used to return every product."""

    def setUp(self):
        make_product(name="Mefenamic Acid", indications="Analgesic for mild to moderate pain")
        make_product(name="Cetirizine", generic_name="Cetirizine", indications="Allergy relief")

    def test_unrelated_multi_word_query_returns_nothing(self):
        self.assertEqual(names(list_products(query="foo bar")), [])

    def test_multi_word_query_requires_all_terms(self):
        self.assertEqual(names(list_products(query="moderate pain")), ["Mefenamic Acid"])
        self.assertEqual(names(list_products(query="pain relief")), [])

    def test_prefix_mode_multi_word_query_requires_all_terms(self):
        self.assertEqual(names(list_products(query="aller rel", prefix=True)), ["Cetirizine"])
        self.assertEqual(names(list_products(query="foo bar", prefix=True)), [])


class OrderingTests(TestCase):
    def test_orders_by_bucket_then_rank_desc_then_name_asc(self):
        # Equal-rank FTS matches (term only in generic_name, weight A).
        make_product(name="Zyrtec", generic_name="Cetirizine")
        make_product(name="Allerkid", generic_name="Cetirizine")
        # Higher rank: term in both name (A) and generic_name (A).
        make_product(name="Cetirizine Syrup", generic_name="Cetirizine")
        # Lower rank: description only (D).
        make_product(name="Antihistamine Pack", description="contains cetirizine")

        results = list(list_products(query="cetirizine"))

        self.assertEqual(
            names(results), ["Cetirizine Syrup", "Allerkid", "Zyrtec", "Antihistamine Pack"]
        )
        ranks = [r.rank for r in results]
        self.assertEqual(ranks, sorted(ranks, reverse=True))
        self.assertEqual(results[1].rank, results[2].rank)  # tie broken by name

    def test_no_query_orders_by_name(self):
        make_product(name="Bravo")
        make_product(name="Alpha")

        self.assertEqual(names(list_products()), ["Alpha", "Bravo"])
