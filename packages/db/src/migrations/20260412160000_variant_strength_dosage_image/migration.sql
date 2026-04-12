-- Move strength, dosage_form, and image_url from medical_products to medical_product_variants.
-- Rebuild FTS index without removed product columns.

DROP INDEX IF EXISTS "medical_products_fts_idx";

ALTER TABLE "medical_product_variants" ADD COLUMN IF NOT EXISTS "strength" text;
ALTER TABLE "medical_product_variants" ADD COLUMN IF NOT EXISTS "dosage_form" text;
ALTER TABLE "medical_product_variants" ADD COLUMN IF NOT EXISTS "image_url" text;

UPDATE "medical_product_variants" AS v
SET
	"strength" = COALESCE(NULLIF(TRIM(p."strength"), ''), v."strength"),
	"dosage_form" = COALESCE(NULLIF(TRIM(p."dosage_form"), ''), v."dosage_form"),
	"image_url" = COALESCE(NULLIF(TRIM(p."image_url"), ''), v."image_url")
FROM "medical_products" AS p
WHERE v."product_id" = p."id";

ALTER TABLE "medical_products" DROP COLUMN IF EXISTS "strength";
ALTER TABLE "medical_products" DROP COLUMN IF EXISTS "dosage_form";
ALTER TABLE "medical_products" DROP COLUMN IF EXISTS "image_url";

CREATE INDEX "medical_products_fts_idx"
ON "medical_products"
USING GIN (
	to_tsvector(
		'english',
		coalesce("name",'') || ' ' ||
		coalesce("brand_name",'') || ' ' ||
		coalesce("generic_name",'') || ' ' ||
		coalesce("manufacturer",'') || ' ' ||
		coalesce("description",'')
	)
);
