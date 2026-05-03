# Adds matched_owner_ids to product_searches (shared with Drizzle schema).
# Table is owned by Drizzle (packages/db); we CREATE IF NOT EXISTS so this
# migration is safe whether Drizzle ran first or the Django service is the
# only thing applied against a fresh database.

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("analytics", "0001_product_page_engagement"),
    ]

    operations = [
        migrations.RunSQL(
            sql=(
                "CREATE TABLE IF NOT EXISTS product_searches ("
                "  id text PRIMARY KEY,"
                "  customer_id text,"
                "  search_query text NOT NULL,"
                "  results_count integer NOT NULL DEFAULT 0,"
                "  searched_at timestamp NOT NULL DEFAULT now()"
                ");"
                "CREATE INDEX IF NOT EXISTS product_searches_customer_id_idx "
                "  ON product_searches (customer_id);"
                "CREATE INDEX IF NOT EXISTS product_searches_searched_at_idx "
                "  ON product_searches (searched_at);"
                "ALTER TABLE product_searches "
                "  ADD COLUMN IF NOT EXISTS matched_owner_ids JSONB DEFAULT '[]'::jsonb;"
            ),
            reverse_sql="ALTER TABLE product_searches DROP COLUMN IF EXISTS matched_owner_ids;",
        ),
    ]
