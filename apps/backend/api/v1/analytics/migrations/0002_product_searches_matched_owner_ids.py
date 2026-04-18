# Adds matched_owner_ids to product_searches (shared with Drizzle schema).

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("analytics", "0001_product_page_engagement"),
    ]

    operations = [
        migrations.RunSQL(
            sql=(
                "ALTER TABLE product_searches "
                "ADD COLUMN IF NOT EXISTS matched_owner_ids JSONB DEFAULT '[]'::jsonb;"
            ),
            reverse_sql="ALTER TABLE product_searches DROP COLUMN IF EXISTS matched_owner_ids;",
        ),
    ]
