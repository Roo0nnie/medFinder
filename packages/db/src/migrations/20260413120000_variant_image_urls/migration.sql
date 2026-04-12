-- Multiple gallery images per variant (JSON array of URL strings).
ALTER TABLE "medical_product_variants" ADD COLUMN IF NOT EXISTS "image_urls" jsonb;
