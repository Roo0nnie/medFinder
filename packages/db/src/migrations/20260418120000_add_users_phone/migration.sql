-- Optional Philippine-format mobile for customer profiles (+6309…).
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" text;
