-- Enrich medical_products for better medical search relevance.
-- Adds optional search fields and rebuilds FTS + trigram indexes for hybrid matching.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE "medical_products" ADD COLUMN IF NOT EXISTS "indications" text;
ALTER TABLE "medical_products" ADD COLUMN IF NOT EXISTS "active_ingredients" text;
ALTER TABLE "medical_products" ADD COLUMN IF NOT EXISTS "search_synonyms" text;

-- Minimal backfill from existing product text when fields are empty.
UPDATE "medical_products"
SET "indications" = COALESCE(NULLIF(TRIM("indications"), ''), NULLIF(TRIM("description"), ''))
WHERE "indications" IS NULL OR TRIM("indications") = '';

UPDATE "medical_products"
SET "active_ingredients" = COALESCE(NULLIF(TRIM("active_ingredients"), ''), NULLIF(TRIM("generic_name"), ''))
WHERE "active_ingredients" IS NULL OR TRIM("active_ingredients") = '';

UPDATE "medical_products"
SET "search_synonyms" = COALESCE(
	NULLIF(TRIM("search_synonyms"), ''),
	NULLIF(TRIM("generic_name"), ''),
	NULLIF(TRIM("brand_name"), '')
)
WHERE "search_synonyms" IS NULL OR TRIM("search_synonyms") = '';

DROP INDEX IF EXISTS "medical_products_fts_idx";

CREATE INDEX "medical_products_fts_idx"
ON "medical_products"
USING GIN (
	(
		setweight(to_tsvector('english', coalesce("name", '')), 'A') ||
		setweight(to_tsvector('english', coalesce("generic_name", '')), 'A') ||
		setweight(to_tsvector('english', coalesce("brand_name", '')), 'B') ||
		setweight(to_tsvector('english', coalesce("search_synonyms", '')), 'B') ||
		setweight(to_tsvector('english', coalesce("indications", '')), 'C') ||
		setweight(to_tsvector('english', coalesce("active_ingredients", '')), 'C') ||
		setweight(to_tsvector('english', coalesce("manufacturer", '')), 'D') ||
		setweight(to_tsvector('english', coalesce("description", '')), 'D')
	)
);

CREATE INDEX IF NOT EXISTS "medical_products_name_trgm_idx"
ON "medical_products"
USING GIN ("name" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "medical_products_brand_name_trgm_idx"
ON "medical_products"
USING GIN ("brand_name" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "medical_products_generic_name_trgm_idx"
ON "medical_products"
USING GIN ("generic_name" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "medical_products_search_synonyms_trgm_idx"
ON "medical_products"
USING GIN ("search_synonyms" gin_trgm_ops);
