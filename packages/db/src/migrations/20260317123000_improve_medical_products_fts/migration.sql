-- Improve full-text search support for medical_products.
-- Rebuild the GIN expression index to include more product attributes that users commonly search for.
--
-- Notes:
-- - We keep an expression index (no schema change) to stay compatible with Drizzle schema.ts.
-- - Django search should use the same 'english' config and field set to maximize index usage.
DROP INDEX IF EXISTS "medical_products_fts_idx";

CREATE INDEX "medical_products_fts_idx"
ON "medical_products"
USING GIN (
  to_tsvector(
    'english',
    coalesce("name",'') || ' ' ||
    coalesce("brand_name",'') || ' ' ||
    coalesce("generic_name",'') || ' ' ||
    coalesce("manufacturer",'') || ' ' ||
    coalesce("dosage_form",'') || ' ' ||
    coalesce("strength",'') || ' ' ||
    coalesce("description",'')
  )
);

