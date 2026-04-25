-- User last-known location (opt-in persistence for map / nearest features).
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "latitude" real;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "longitude" real;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "location_accuracy" real;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "location_updated_at" timestamp;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "location_consent_at" timestamp;

-- Bounding-box prefilter for nearest-pharmacy queries.
CREATE INDEX IF NOT EXISTS "pharmacies_active_geo_idx" ON "pharmacies" ("is_active", "latitude", "longitude");

-- Common public map query: approved + active pharmacies with coordinates.
CREATE INDEX IF NOT EXISTS "pharmacies_active_approved_geo_idx" ON "pharmacies" ("latitude", "longitude") WHERE "is_active" = true AND "certificate_status" = 'approved';
