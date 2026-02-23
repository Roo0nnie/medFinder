CREATE TABLE "accounts" (
	"id" text,
	"account_id" text,
	"provider_id" text,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_pkey" PRIMARY KEY("provider_id","account_id")
);
--> statement-breakpoint
CREATE TABLE "medical_products" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"generic_name" text,
	"brand_name" text,
	"description" text,
	"manufacturer" text,
	"category_id" text NOT NULL,
	"dosage_form" text,
	"strength" text,
	"unit" text NOT NULL,
	"requires_prescription" boolean DEFAULT false NOT NULL,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pharmacies" (
	"id" text PRIMARY KEY,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"zip_code" text NOT NULL,
	"country" text DEFAULT 'US' NOT NULL,
	"latitude" real,
	"longitude" real,
	"phone" text,
	"email" text,
	"website" text,
	"operating_hours" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pharmacy_inventory" (
	"id" text PRIMARY KEY,
	"pharmacy_id" text NOT NULL,
	"product_id" text NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"price" numeric(10,2) NOT NULL,
	"discount_price" numeric(10,2),
	"expiry_date" timestamp,
	"batch_number" text,
	"is_available" boolean DEFAULT true NOT NULL,
	"last_restocked" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pharmacy_reviews" (
	"id" text PRIMARY KEY,
	"pharmacy_id" text NOT NULL,
	"user_id" text NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pharmacy_staff" (
	"id" text PRIMARY KEY,
	"pharmacy_id" text NOT NULL,
	"staff_id" text NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL UNIQUE,
	"description" text,
	"parent_category_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_reservations" (
	"id" text PRIMARY KEY,
	"customer_id" text NOT NULL,
	"inventory_id" text NOT NULL,
	"quantity" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_reviews" (
	"id" text PRIMARY KEY,
	"product_id" text NOT NULL,
	"user_id" text NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_searches" (
	"id" text PRIMARY KEY,
	"customer_id" text,
	"search_query" text NOT NULL,
	"results_count" integer DEFAULT 0 NOT NULL,
	"searched_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY,
	"token" text NOT NULL UNIQUE,
	"user_id" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"department" text NOT NULL,
	"position" text NOT NULL,
	"specialization" text,
	"bio" text,
	"phone" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"name" text,
	"first_name" text,
	"last_name" text NOT NULL,
	"middle_name" text,
	"role" text DEFAULT 'customer' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text,
	"identifier" text,
	"value" text,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "verifications_pkey" PRIMARY KEY("identifier","value")
);
--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "accounts" ("user_id");--> statement-breakpoint
CREATE INDEX "medical_products_category_id_idx" ON "medical_products" ("category_id");--> statement-breakpoint
CREATE INDEX "medical_products_name_idx" ON "medical_products" ("name");--> statement-breakpoint
CREATE INDEX "medical_products_requires_prescription_idx" ON "medical_products" ("requires_prescription");--> statement-breakpoint
CREATE INDEX "pharmacies_owner_id_idx" ON "pharmacies" ("owner_id");--> statement-breakpoint
CREATE INDEX "pharmacies_is_active_idx" ON "pharmacies" ("is_active");--> statement-breakpoint
CREATE INDEX "pharmacies_city_idx" ON "pharmacies" ("city");--> statement-breakpoint
CREATE INDEX "pharmacy_inventory_pharmacy_id_idx" ON "pharmacy_inventory" ("pharmacy_id");--> statement-breakpoint
CREATE INDEX "pharmacy_inventory_product_id_idx" ON "pharmacy_inventory" ("product_id");--> statement-breakpoint
CREATE INDEX "pharmacy_inventory_is_available_idx" ON "pharmacy_inventory" ("is_available");--> statement-breakpoint
CREATE INDEX "pharmacy_inventory_expiry_date_idx" ON "pharmacy_inventory" ("expiry_date");--> statement-breakpoint
CREATE INDEX "pharmacy_reviews_pharmacy_id_idx" ON "pharmacy_reviews" ("pharmacy_id");--> statement-breakpoint
CREATE INDEX "pharmacy_reviews_user_id_idx" ON "pharmacy_reviews" ("user_id");--> statement-breakpoint
CREATE INDEX "pharmacy_reviews_pharmacy_user_idx" ON "pharmacy_reviews" ("pharmacy_id","user_id");--> statement-breakpoint
CREATE INDEX "pharmacy_staff_pharmacy_id_idx" ON "pharmacy_staff" ("pharmacy_id");--> statement-breakpoint
CREATE INDEX "pharmacy_staff_staff_id_idx" ON "pharmacy_staff" ("staff_id");--> statement-breakpoint
CREATE INDEX "product_categories_parent_id_idx" ON "product_categories" ("parent_category_id");--> statement-breakpoint
CREATE INDEX "product_reservations_customer_id_idx" ON "product_reservations" ("customer_id");--> statement-breakpoint
CREATE INDEX "product_reservations_inventory_id_idx" ON "product_reservations" ("inventory_id");--> statement-breakpoint
CREATE INDEX "product_reservations_status_idx" ON "product_reservations" ("status");--> statement-breakpoint
CREATE INDEX "product_reservations_expires_at_idx" ON "product_reservations" ("expires_at");--> statement-breakpoint
CREATE INDEX "product_reviews_product_id_idx" ON "product_reviews" ("product_id");--> statement-breakpoint
CREATE INDEX "product_reviews_user_id_idx" ON "product_reviews" ("user_id");--> statement-breakpoint
CREATE INDEX "product_reviews_product_user_idx" ON "product_reviews" ("product_id","user_id");--> statement-breakpoint
CREATE INDEX "product_searches_customer_id_idx" ON "product_searches" ("customer_id");--> statement-breakpoint
CREATE INDEX "product_searches_searched_at_idx" ON "product_searches" ("searched_at");--> statement-breakpoint
CREATE INDEX "staff_user_id_idx" ON "staff" ("user_id");--> statement-breakpoint
CREATE INDEX "staff_is_active_idx" ON "staff" ("is_active");--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "medical_products" ADD CONSTRAINT "medical_products_category_id_product_categories_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_categories"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "pharmacies" ADD CONSTRAINT "pharmacies_owner_id_users_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "pharmacy_inventory" ADD CONSTRAINT "pharmacy_inventory_pharmacy_id_pharmacies_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "pharmacies"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "pharmacy_inventory" ADD CONSTRAINT "pharmacy_inventory_product_id_medical_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "medical_products"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "pharmacy_reviews" ADD CONSTRAINT "pharmacy_reviews_pharmacy_id_pharmacies_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "pharmacies"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "pharmacy_reviews" ADD CONSTRAINT "pharmacy_reviews_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "pharmacy_staff" ADD CONSTRAINT "pharmacy_staff_pharmacy_id_pharmacies_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "pharmacies"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "pharmacy_staff" ADD CONSTRAINT "pharmacy_staff_staff_id_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "product_reservations" ADD CONSTRAINT "product_reservations_customer_id_users_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "product_reservations" ADD CONSTRAINT "product_reservations_inventory_id_pharmacy_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "pharmacy_inventory"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_product_id_medical_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "medical_products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "product_searches" ADD CONSTRAINT "product_searches_customer_id_users_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;