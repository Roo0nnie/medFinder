ALTER TABLE "product_categories"
ADD COLUMN IF NOT EXISTS "requires_prescription" boolean DEFAULT false NOT NULL;

