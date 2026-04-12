-- Move sellable unit from medical_products to medical_product_variants (per SKU).

ALTER TABLE "medical_product_variants" ADD COLUMN IF NOT EXISTS "unit" text;

UPDATE "medical_product_variants" AS v
SET "unit" = COALESCE(NULLIF(TRIM(p."unit"), ''), 'piece')
FROM "medical_products" AS p
WHERE v."product_id" = p."id";

UPDATE "medical_product_variants"
SET "unit" = 'piece'
WHERE "unit" IS NULL OR TRIM("unit") = '';

ALTER TABLE "medical_product_variants" ALTER COLUMN "unit" SET NOT NULL;
ALTER TABLE "medical_product_variants" ALTER COLUMN "unit" SET DEFAULT 'piece';

ALTER TABLE "medical_products" DROP COLUMN IF EXISTS "unit";
