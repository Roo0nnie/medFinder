CREATE TABLE "brands" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"normalized_name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "brands_normalized_name_uidx" ON "brands" USING btree ("normalized_name");
--> statement-breakpoint
CREATE TABLE "owner_brands" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"brand_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "owner_brands" ADD CONSTRAINT "owner_brands_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "owner_brands" ADD CONSTRAINT "owner_brands_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "owner_brands_owner_brand_uidx" ON "owner_brands" USING btree ("owner_id","brand_id");
--> statement-breakpoint
CREATE INDEX "owner_brands_owner_id_idx" ON "owner_brands" USING btree ("owner_id");
--> statement-breakpoint
CREATE INDEX "owner_brands_brand_id_idx" ON "owner_brands" USING btree ("brand_id");
--> statement-breakpoint
ALTER TABLE "medical_products" ADD COLUMN "brand_id" text;
--> statement-breakpoint
ALTER TABLE "medical_products" ADD CONSTRAINT "medical_products_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "medical_products_brand_id_idx" ON "medical_products" USING btree ("brand_id");

-- Backfill: one global brand row per distinct normalized brand name from products
INSERT INTO "brands" ("id", "name", "normalized_name", "created_at", "updated_at")
SELECT gen_random_uuid()::text,
	d.display_name,
	d.norm_key,
	now(),
	now()
FROM (
	SELECT DISTINCT ON (lower(trim(brand_name)))
		lower(trim(brand_name)) AS norm_key,
		trim(brand_name) AS display_name
	FROM medical_products
	WHERE brand_name IS NOT NULL AND trim(brand_name) <> ''
	ORDER BY lower(trim(brand_name)), trim(brand_name)
) AS d;

-- Point products at canonical brand rows
UPDATE medical_products mp
SET brand_id = b.id
FROM brands b
WHERE mp.brand_name IS NOT NULL
	AND trim(mp.brand_name) <> ''
	AND b.normalized_name = lower(trim(mp.brand_name));

-- Junction: each owner who has products using a brand gets a link
INSERT INTO owner_brands (id, owner_id, brand_id, created_at, updated_at)
SELECT gen_random_uuid()::text, d.owner_id, d.brand_id, now(), now()
FROM (
	SELECT DISTINCT p.owner_id, mp.brand_id
	FROM medical_products mp
	INNER JOIN pharmacies p ON p.id = mp.pharmacy_id
	WHERE mp.brand_id IS NOT NULL
) AS d;
