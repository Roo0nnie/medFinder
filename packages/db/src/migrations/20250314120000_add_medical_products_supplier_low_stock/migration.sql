ALTER TABLE "medical_products" ADD COLUMN IF NOT EXISTS "supplier" text;--> statement-breakpoint
ALTER TABLE "medical_products" ADD COLUMN IF NOT EXISTS "low_stock_threshold" integer;
