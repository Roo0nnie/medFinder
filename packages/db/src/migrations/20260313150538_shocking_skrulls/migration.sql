ALTER TABLE "staff" ADD COLUMN "owner_id" text NOT NULL;--> statement-breakpoint
CREATE INDEX "staff_owner_id_idx" ON "staff" ("owner_id");--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_owner_id_users_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
-- Add full-text search support for medical_products using an expression GIN index.
CREATE INDEX "medical_products_fts_idx"
ON "medical_products"
USING GIN (
  to_tsvector(
    'english',
    coalesce("name",'') || ' ' ||
    coalesce("brand_name",'') || ' ' ||
    coalesce("generic_name",'') || ' ' ||
    coalesce("manufacturer",'')
  )
);
