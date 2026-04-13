from django.core.cache import cache
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from api.v1.pharmacies.models import Pharmacy
from api.v1.products.models import MedicalProduct, MedicalProductVariant

_APPROVED_PHARMACY_IDS_CACHE_KEY = "v1:public:approved_active_pharmacy_ids"
_APPROVED_PHARMACY_IDS_CACHE_TTL = 60


def _get_cached_approved_pharmacy_ids() -> list[str]:
    cached = cache.get(_APPROVED_PHARMACY_IDS_CACHE_KEY)
    if cached is not None:
        return cached
    ids = list(
        Pharmacy.objects.filter(is_active=True, certificate_status="approved").values_list("id", flat=True)
    )
    cache.set(_APPROVED_PHARMACY_IDS_CACHE_KEY, ids, _APPROVED_PHARMACY_IDS_CACHE_TTL)
    return ids


class LandingStatsView(APIView):
    """
    Public lightweight counters used on the landing page hero.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        approved_pharmacies_count = Pharmacy.objects.filter(
            is_active=True, certificate_status="approved"
        ).count()

        approved_pharmacy_ids = _get_cached_approved_pharmacy_ids()
        approved_products = MedicalProduct.objects.filter(pharmacy_id__in=approved_pharmacy_ids)
        products_count = approved_products.count()
        variants_count = MedicalProductVariant.objects.filter(product_id__in=approved_products.values("id")).count()

        return Response(
            {
                "productsCount": int(products_count),
                "variantsCount": int(variants_count),
                "approvedPharmaciesCount": int(approved_pharmacies_count),
            }
        )

