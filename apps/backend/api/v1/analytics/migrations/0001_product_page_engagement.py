# Manual migration for product_page_engagements table

import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql="""
                    CREATE TABLE IF NOT EXISTS product_page_engagements (
                        id varchar(255) PRIMARY KEY,
                        product_id varchar(255) NOT NULL,
                        user_id varchar(255) NULL,
                        session_id varchar(255) NULL,
                        dwell_seconds integer NOT NULL DEFAULT 0 CHECK (dwell_seconds >= 0),
                        created_at timestamp with time zone NOT NULL DEFAULT now()
                    );
                    CREATE INDEX IF NOT EXISTS product_page_engagements_product_id_idx
                        ON product_page_engagements (product_id);
                    CREATE INDEX IF NOT EXISTS product_page_engagements_user_id_idx
                        ON product_page_engagements (user_id);
                    CREATE INDEX IF NOT EXISTS analytics_pr_product_idx
                        ON product_page_engagements (product_id, created_at);
                    """,
                    reverse_sql="DROP TABLE IF EXISTS product_page_engagements;",
                )
            ],
            state_operations=[
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
            ],
        ),
    ]
