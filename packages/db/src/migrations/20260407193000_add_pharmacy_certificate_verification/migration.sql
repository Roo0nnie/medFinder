ALTER TABLE "pharmacies" ADD COLUMN "certificate_file_url" text;
ALTER TABLE "pharmacies" ADD COLUMN "certificate_number" text;
ALTER TABLE "pharmacies" ADD COLUMN "certificate_status" text NOT NULL DEFAULT 'pending';
ALTER TABLE "pharmacies" ADD COLUMN "certificate_submitted_at" timestamp;
ALTER TABLE "pharmacies" ADD COLUMN "certificate_reviewed_at" timestamp;
ALTER TABLE "pharmacies" ADD COLUMN "certificate_reviewed_by" text;
ALTER TABLE "pharmacies" ADD COLUMN "certificate_review_note" text;
