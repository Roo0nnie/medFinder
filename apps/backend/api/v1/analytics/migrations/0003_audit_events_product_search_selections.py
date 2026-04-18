# Audit events + product search selections (keep Drizzle schema in sync).

import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("analytics", "0002_product_searches_matched_owner_ids"),
    ]

    operations = [
        migrations.CreateModel(
            name="AuditEvent",
            fields=[
                ("id", models.CharField(editable=False, max_length=255, primary_key=True, serialize=False)),
                ("owner_id", models.CharField(db_index=True, max_length=255)),
                ("actor_user_id", models.CharField(blank=True, max_length=255, null=True)),
                ("actor_role", models.CharField(max_length=32)),
                ("action", models.CharField(max_length=64)),
                ("resource_type", models.CharField(max_length=64)),
                ("resource_id", models.CharField(blank=True, max_length=255, null=True)),
                ("details", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
            ],
            options={
                "db_table": "audit_events",
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="auditevent",
            index=models.Index(fields=["owner_id", "created_at"], name="audit_events_owner_created_idx"),
        ),
        migrations.CreateModel(
            name="ProductSearchSelection",
            fields=[
                ("id", models.CharField(editable=False, max_length=255, primary_key=True, serialize=False)),
                ("product_id", models.CharField(db_index=True, max_length=255)),
                ("pharmacy_id", models.CharField(blank=True, max_length=255, null=True)),
                ("owner_id", models.CharField(db_index=True, max_length=255)),
                ("search_query", models.TextField(blank=True)),
                ("customer_id", models.CharField(blank=True, max_length=255, null=True)),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
            ],
            options={
                "db_table": "product_search_selections",
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="productsearchselection",
            index=models.Index(fields=["owner_id", "product_id"], name="prod_search_sel_owner_prod_idx"),
        ),
    ]
