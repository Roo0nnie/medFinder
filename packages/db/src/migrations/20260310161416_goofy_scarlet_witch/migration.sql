CREATE TABLE "deletion_requests" (
	"id" text PRIMARY KEY,
	"product_id" text NOT NULL,
	"pharmacy_id" text NOT NULL,
	"requested_by" text NOT NULL,
	"reviewed_by" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pharmacies" ADD COLUMN "logo" text;--> statement-breakpoint
ALTER TABLE "pharmacies" ADD COLUMN "google_map_embed" text;--> statement-breakpoint
ALTER TABLE "pharmacies" ADD COLUMN "social_links" text;--> statement-breakpoint
CREATE INDEX "deletion_requests_product_id_idx" ON "deletion_requests" ("product_id");--> statement-breakpoint
CREATE INDEX "deletion_requests_pharmacy_id_idx" ON "deletion_requests" ("pharmacy_id");--> statement-breakpoint
CREATE INDEX "deletion_requests_requested_by_idx" ON "deletion_requests" ("requested_by");--> statement-breakpoint
CREATE INDEX "deletion_requests_reviewed_by_idx" ON "deletion_requests" ("reviewed_by");--> statement-breakpoint
CREATE INDEX "deletion_requests_status_idx" ON "deletion_requests" ("status");--> statement-breakpoint
ALTER TABLE "deletion_requests" ADD CONSTRAINT "deletion_requests_product_id_medical_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "medical_products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "deletion_requests" ADD CONSTRAINT "deletion_requests_pharmacy_id_pharmacies_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "pharmacies"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "deletion_requests" ADD CONSTRAINT "deletion_requests_requested_by_users_id_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "deletion_requests" ADD CONSTRAINT "deletion_requests_reviewed_by_users_id_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL;