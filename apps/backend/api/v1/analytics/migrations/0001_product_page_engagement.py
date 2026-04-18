# Manual migration for product_page_engagements table

import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="ProductPageEngagement",
            fields=[
                ("id", models.CharField(editable=False, max_length=255, primary_key=True, serialize=False)),
                ("product_id", models.CharField(db_index=True, max_length=255)),
                ("user_id", models.CharField(blank=True, db_index=True, max_length=255, null=True)),
                ("session_id", models.CharField(blank=True, max_length=255, null=True)),
                ("dwell_seconds", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
            ],
            options={
                "db_table": "product_page_engagements",
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="productpageengagement",
            index=models.Index(fields=["product_id", "created_at"], name="analytics_pr_product_idx"),
        ),
    ]
