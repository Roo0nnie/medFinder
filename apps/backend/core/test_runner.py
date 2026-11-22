"""
Test runner for a schema owned outside Django.

Production tables are created by Drizzle (packages/db), so almost every Django
model is declared with ``managed = False``. Django's test database setup would
skip those tables, so this runner temporarily flips them to managed for the
test run. The test schema is therefore derived from the Django model
definitions (not the Drizzle SQL), which is what the ORM code under test
actually queries.
"""
from django.apps import apps
from django.test.runner import DiscoverRunner


class UnmanagedModelTestRunner(DiscoverRunner):
    def setup_test_environment(self, **kwargs):
        self._unmanaged_models = [m for m in apps.get_models() if not m._meta.managed]
        for model in self._unmanaged_models:
            model._meta.managed = True
        super().setup_test_environment(**kwargs)

    def teardown_test_environment(self, **kwargs):
        super().teardown_test_environment(**kwargs)
        for model in self._unmanaged_models:
            model._meta.managed = False
