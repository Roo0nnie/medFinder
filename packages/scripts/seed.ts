/**
 * Seed script: creates users per role plus deterministic pharmacies, brands,
 * categories, products (24 total; 20 at owner1 HealthPlus), variants, and inventory.
 *
 * Run from repo root: pnpm db:seed
 * Requires: DATABASE_URL (packages/db/.env), BETTER_AUTH_SECRET + BETTER_AUTH_TRUSTED_ORIGINS (apps/web/.env)
 */
import "./load-env"

import { eq } from "drizzle-orm"

import { getAuth } from "@repo/auth"
import { createDBClient } from "@repo/db/client"
import {
	brands,
	medicalProducts,
	medicalProductVariants,
	ownerBrands,
	pharmacies,
	pharmacyInventory,
	productCategories,
	users,
} from "@repo/db/schema"

const ROLES = ["admin", "customer", "staff", "owner"] as const
type Role = (typeof ROLES)[number]

type SeedUser = {
	email: string
	password: string
	firstName: string
	lastName: string
	middleName: string
	role: Role
}

function normalizedBrandName(name: string): string {
	return name.trim().toLowerCase().replace(/\s+/g, " ")
}

async function seedUser(auth: ReturnType<typeof getAuth>, db: ReturnType<typeof createDBClient>, u: SeedUser) {
	const existing = await db.select().from(users).where(eq(users.email, u.email)).limit(1)
	if (existing.length > 0) {
		await db
			.update(users)
			.set({
				first_name: u.firstName,
				last_name: u.lastName,
				middle_name: u.middleName,
				role: u.role,
				updatedAt: new Date(),
			})
			.where(eq(users.id, existing[0]!.id))
		console.log(`Updated existing user: ${u.email} (${u.role})`)
		return existing[0]!.id
	}

	try {
		const result = await auth.api.signUpEmail({
			body: {
				name: `${u.firstName} ${u.lastName}`.trim(),
				email: u.email,
				password: u.password,
				firstName: u.firstName,
				lastName: u.lastName,
				middleName: u.middleName,
				role: u.role,
			} as { name: string; email: string; password: string },
		})

		const userId = result.user.id
		await db
			.update(users)
			.set({
				first_name: u.firstName,
				last_name: u.lastName,
				middle_name: u.middleName,
				role: u.role,
				updatedAt: new Date(),
			})
			.where(eq(users.id, userId))

		console.log(`Created user: ${u.email} (${u.role})`)
		return userId
	} catch (err) {
		console.error(`Failed to create ${u.email}:`, err instanceof Error ? err.message : err)
		throw err
	}
}

function buildSeedUsers(): SeedUser[] {
	const password = "password123"
	const admin: SeedUser = {
		email: "admin@example.com",
		password,
		firstName: "Admin",
		lastName: "User",
		middleName: "A",
		role: "admin",
	}

	const owners: SeedUser[] = [
		{ email: "owner1@example.com", password, firstName: "Owner", lastName: "One", middleName: "O1", role: "owner" },
		{ email: "owner2@example.com", password, firstName: "Owner", lastName: "Two", middleName: "O2", role: "owner" },
	]

	const customers: SeedUser[] = Array.from({ length: 5 }, (_, idx) => {
		const n = idx + 1
		return {
			email: `customer${n}@example.com`,
			password,
			firstName: "Customer",
			lastName: `User${n}`,
			middleName: `C${n}`,
			role: "customer",
		}
	})

	return [admin, ...owners, ...customers]
}

async function seedPharmacies(db: ReturnType<typeof createDBClient>, ownerIds: Record<string, string>) {
	const now = new Date()
	const o1 = ownerIds["owner1@example.com"]
	const o2 = ownerIds["owner2@example.com"]
	if (!o1 || !o2) throw new Error("Expected owner1@example.com and owner2@example.com in seed users")

	const rows = [
		{
			id: "seed-pharmacy-1",
			ownerId: o1,
			name: "HealthPlus Pharmacy",
			description: "Seed pharmacy (owner1)",
			address: "123 Rizal Ave, Manila",
			city: "Manila",
			municipality: null as string | null,
			state: "NCR",
			zipCode: "1000",
			country: "PH",
			certificateStatus: "approved" as const,
			isActive: true,
			latitude: 14.5995,
			longitude: 120.9842,
		},
		{
			id: "seed-pharmacy-2",
			ownerId: o2,
			name: "MediCare Drugstore",
			description: "Seed pharmacy (owner2)",
			address: "456 Commonwealth Ave, QC",
			city: "Quezon City",
			municipality: null as string | null,
			state: "NCR",
			zipCode: "1100",
			country: "PH",
			certificateStatus: "approved" as const,
			isActive: true,
			latitude: 14.676,
			longitude: 121.0437,
		},
	]

	for (const r of rows) {
		await db
			.insert(pharmacies)
			.values({
				...r,
				createdAt: now,
				updatedAt: now,
			})
			.onConflictDoUpdate({
				target: pharmacies.id,
				set: {
					ownerId: r.ownerId,
					name: r.name,
					description: r.description,
					address: r.address,
					city: r.city,
					municipality: r.municipality,
					state: r.state,
					zipCode: r.zipCode,
					country: r.country,
					certificateStatus: r.certificateStatus,
					isActive: r.isActive,
					latitude: r.latitude,
					longitude: r.longitude,
					updatedAt: now,
				},
			})
	}
	console.log("Seeded pharmacies (2).")
}

async function seedBrands(db: ReturnType<typeof createDBClient>, ownerIds: Record<string, string>) {
	const now = new Date()
	const o1 = ownerIds["owner1@example.com"]
	const o2 = ownerIds["owner2@example.com"]
	if (!o1 || !o2) throw new Error("Expected owners for brand links")

	const brandDefs = [
		{ id: "seed-brand-biogesic", name: "Biogesic" },
		{ id: "seed-brand-tempra", name: "Tempra" },
		{ id: "seed-brand-calpol", name: "Calpol" },
		{ id: "seed-brand-ritemed", name: "RiteMed" },
		{ id: "seed-brand-neozep", name: "Neozep" },
		{ id: "seed-brand-solmux", name: "Solmux" },
		{ id: "seed-brand-enervon", name: "Enervon" },
		{ id: "seed-brand-diatabs", name: "Diatabs" },
		{ id: "seed-brand-alaxan", name: "Alaxan" },
		{ id: "seed-brand-ceelin", name: "Ceelin" },
		{ id: "seed-brand-bioflu", name: "Bioflu" },
		{ id: "seed-brand-bactidol", name: "Bactidol" },
	]

	const nameToId: Record<string, string> = {}

	for (const b of brandDefs) {
		const nn = normalizedBrandName(b.name)
		await db
			.insert(brands)
			.values({
				id: b.id,
				name: b.name,
				normalizedName: nn,
				createdAt: now,
				updatedAt: now,
			})
			.onConflictDoUpdate({
				target: brands.id,
				set: {
					name: b.name,
					normalizedName: nn,
					updatedAt: now,
				},
			})
		nameToId[b.name] = b.id
	}

	const links: { id: string; ownerId: string; brandId: string }[] = [
		{ id: "seed-ob-bio-o1", ownerId: o1, brandId: nameToId["Biogesic"]! },
		{ id: "seed-ob-bio-o2", ownerId: o2, brandId: nameToId["Biogesic"]! },
		{ id: "seed-ob-tem-o1", ownerId: o1, brandId: nameToId["Tempra"]! },
		{ id: "seed-ob-cal-o2", ownerId: o2, brandId: nameToId["Calpol"]! },
		{ id: "seed-ob-rm-o1", ownerId: o1, brandId: nameToId["RiteMed"]! },
		{ id: "seed-ob-rm-o2", ownerId: o2, brandId: nameToId["RiteMed"]! },
		{ id: "seed-ob-neozep-o1", ownerId: o1, brandId: nameToId["Neozep"]! },
		{ id: "seed-ob-neozep-o2", ownerId: o2, brandId: nameToId["Neozep"]! },
		{ id: "seed-ob-solmux-o1", ownerId: o1, brandId: nameToId["Solmux"]! },
		{ id: "seed-ob-enervon-o1", ownerId: o1, brandId: nameToId["Enervon"]! },
		{ id: "seed-ob-diatabs-o1", ownerId: o1, brandId: nameToId["Diatabs"]! },
		{ id: "seed-ob-alaxan-o1", ownerId: o1, brandId: nameToId["Alaxan"]! },
		{ id: "seed-ob-ceelin-o1", ownerId: o1, brandId: nameToId["Ceelin"]! },
		{ id: "seed-ob-bioflu-o1", ownerId: o1, brandId: nameToId["Bioflu"]! },
		{ id: "seed-ob-bactidol-o1", ownerId: o1, brandId: nameToId["Bactidol"]! },
	]

	for (const l of links) {
		await db
			.insert(ownerBrands)
			.values({
				...l,
				createdAt: now,
				updatedAt: now,
			})
			.onConflictDoUpdate({
				target: ownerBrands.id,
				set: {
					ownerId: l.ownerId,
					brandId: l.brandId,
					updatedAt: now,
				},
			})
	}

	console.log("Seeded brands and owner_brands.")
	return nameToId
}

type SeedCategoryIds = {
	o1Pain: string
	o1Cold: string
	o1Vitamins: string
	o1Digestive: string
	o1Skin: string
	o2Pain: string
}

async function seedProductCategories(
	db: ReturnType<typeof createDBClient>,
	ownerIds: Record<string, string>
): Promise<SeedCategoryIds> {
	const now = new Date()
	const o1 = ownerIds["owner1@example.com"]
	const o2 = ownerIds["owner2@example.com"]
	if (!o1 || !o2) throw new Error("Expected owners for categories")

	const rows = [
		{ id: "seed-category-pain-o1", ownerId: o1, name: "Pain Relief" },
		{ id: "seed-category-cold-o1", ownerId: o1, name: "Cold & Flu" },
		{ id: "seed-category-vitamins-o1", ownerId: o1, name: "Vitamins & Supplements" },
		{ id: "seed-category-digestive-o1", ownerId: o1, name: "Digestive Care" },
		{ id: "seed-category-skin-o1", ownerId: o1, name: "Skin Care" },
		{ id: "seed-category-pain-o2", ownerId: o2, name: "Pain Relief" },
	]

	for (const r of rows) {
		await db
			.insert(productCategories)
			.values({
				id: r.id,
				ownerId: r.ownerId,
				name: r.name,
				description: "",
				requiresPrescription: false,
				createdAt: now,
				updatedAt: now,
			})
			.onConflictDoUpdate({
				target: productCategories.id,
				set: {
					ownerId: r.ownerId,
					name: r.name,
					updatedAt: now,
				},
			})
	}

	console.log("Seeded product categories (6).")
	return {
		o1Pain: "seed-category-pain-o1",
		o1Cold: "seed-category-cold-o1",
		o1Vitamins: "seed-category-vitamins-o1",
		o1Digestive: "seed-category-digestive-o1",
		o1Skin: "seed-category-skin-o1",
		o2Pain: "seed-category-pain-o2",
	}
}

type ProductSeedRow = {
	productId: string
	variantId: string
	inventoryId: string
	pharmacyId: string
	categoryId: string
	name: string
	genericName: string
	brandName: string
	brandKey: string
	strength: string
	dosageForm: string
	variantLabel: string
	unit: string
	price: string
	quantity: number
}

/** Single demo image URL applied to every seeded product variant (gallery uses two identical slides). */
const SEED_DEFAULT_PRODUCT_IMAGE =
	"https://www.shielddrugstore.com/web/image/product.product/22893/image_1024/%5BOTC-T10186-PAIN-CAT00103%5D%20Biogesic%20%28paracetamol%29%20250mg-5ml%20strawberry-flavored%20suspension%2C%2060ml?unique=e871f6d"

const SEED_DEFAULT_VARIANT_GALLERY: string[] = [SEED_DEFAULT_PRODUCT_IMAGE, SEED_DEFAULT_PRODUCT_IMAGE]

async function seedProducts(
	db: ReturnType<typeof createDBClient>,
	ctx: {
		pharmacyMap: Record<string, string>
		brandMap: Record<string, string>
		categories: SeedCategoryIds
	}
) {
	const now = new Date()
	const ph = (key: "hp" | "mc") => (key === "hp" ? ctx.pharmacyMap.hp : ctx.pharmacyMap.mc)
	const b = (name: string) => ctx.brandMap[name]!
	const c = ctx.categories

	const defs: ProductSeedRow[] = [
		{
			productId: "seed-product-1",
			variantId: "seed-variant-1",
			inventoryId: "seed-inv-1",
			pharmacyId: ph("hp"),
			categoryId: c.o1Pain,
			name: "Biogesic Paracetamol",
			genericName: "Paracetamol",
			brandName: "Biogesic",
			brandKey: "Biogesic",
			strength: "500mg",
			dosageForm: "Tablet",
			variantLabel: "Box of 100",
			unit: "box",
			price: "120.00",
			quantity: 80,
		},
		{
			productId: "seed-product-2",
			variantId: "seed-variant-2",
			inventoryId: "seed-inv-2",
			pharmacyId: ph("hp"),
			categoryId: c.o1Pain,
			name: "Tempra Paracetamol",
			genericName: "Paracetamol",
			brandName: "Tempra",
			brandKey: "Tempra",
			strength: "500mg",
			dosageForm: "Tablet",
			variantLabel: "Box of 50",
			unit: "box",
			price: "135.50",
			quantity: 40,
		},
		{
			productId: "seed-product-3",
			variantId: "seed-variant-3",
			inventoryId: "seed-inv-3",
			pharmacyId: ph("mc"),
			categoryId: c.o2Pain,
			name: "Biogesic Paracetamol",
			genericName: "Paracetamol",
			brandName: "Biogesic",
			brandKey: "Biogesic",
			strength: "500mg",
			dosageForm: "Tablet",
			variantLabel: "Box of 100",
			unit: "box",
			price: "118.00",
			quantity: 60,
		},
		{
			productId: "seed-product-4",
			variantId: "seed-variant-4",
			inventoryId: "seed-inv-4",
			pharmacyId: ph("mc"),
			categoryId: c.o2Pain,
			name: "Calpol Paracetamol",
			genericName: "Paracetamol",
			brandName: "Calpol",
			brandKey: "Calpol",
			strength: "500mg",
			dosageForm: "Syrup",
			variantLabel: "Bottle 60ml",
			unit: "bottle",
			price: "95.00",
			quantity: 35,
		},
		{
			productId: "seed-product-5",
			variantId: "seed-variant-5",
			inventoryId: "seed-inv-5",
			pharmacyId: ph("hp"),
			categoryId: c.o1Pain,
			name: "RiteMed Paracetamol",
			genericName: "Paracetamol",
			brandName: "RiteMed",
			brandKey: "RiteMed",
			strength: "500mg",
			dosageForm: "Tablet",
			variantLabel: "Strip of 10",
			unit: "strip",
			price: "45.00",
			quantity: 200,
		},
		{
			productId: "seed-product-6",
			variantId: "seed-variant-6",
			inventoryId: "seed-inv-6",
			pharmacyId: ph("mc"),
			categoryId: c.o2Pain,
			name: "RiteMed Paracetamol",
			genericName: "Paracetamol",
			brandName: "RiteMed",
			brandKey: "RiteMed",
			strength: "500mg",
			dosageForm: "Tablet",
			variantLabel: "Strip of 10",
			unit: "strip",
			price: "44.50",
			quantity: 150,
		},
		{
			productId: "seed-product-7",
			variantId: "seed-variant-7",
			inventoryId: "seed-inv-7",
			pharmacyId: ph("hp"),
			categoryId: c.o1Pain,
			name: "Biogesic Ibuprofen",
			genericName: "Ibuprofen",
			brandName: "Biogesic",
			brandKey: "Biogesic",
			strength: "200mg",
			dosageForm: "Tablet",
			variantLabel: "Box of 20",
			unit: "box",
			price: "210.00",
			quantity: 25,
		},
		{
			productId: "seed-product-8",
			variantId: "seed-variant-8",
			inventoryId: "seed-inv-8",
			pharmacyId: ph("mc"),
			categoryId: c.o2Pain,
			name: "Advil Ibuprofen",
			genericName: "Ibuprofen",
			brandName: "RiteMed",
			brandKey: "RiteMed",
			strength: "200mg",
			dosageForm: "Capsule",
			variantLabel: "Bottle 30",
			unit: "bottle",
			price: "199.99",
			quantity: 18,
		},
		// Owner1 / HealthPlus — additional catalog (16 products → 20+ at seed-pharmacy-1)
		{
			productId: "seed-product-9",
			variantId: "seed-variant-9",
			inventoryId: "seed-inv-9",
			pharmacyId: ph("hp"),
			categoryId: c.o1Cold,
			name: "Neozep Cold Tablet",
			genericName: "Phenylpropanolamine + Paracetamol",
			brandName: "Neozep",
			brandKey: "Neozep",
			strength: "NA",
			dosageForm: "Tablet",
			variantLabel: "Strip of 4",
			unit: "strip",
			price: "52.00",
			quantity: 120,
		},
		{
			productId: "seed-product-10",
			variantId: "seed-variant-10",
			inventoryId: "seed-inv-10",
			pharmacyId: ph("hp"),
			categoryId: c.o1Cold,
			name: "Neozep Non-Drowsy",
			genericName: "Loratadine",
			brandName: "Neozep",
			brandKey: "Neozep",
			strength: "10mg",
			dosageForm: "Tablet",
			variantLabel: "Box of 10",
			unit: "box",
			price: "168.00",
			quantity: 45,
		},
		{
			productId: "seed-product-11",
			variantId: "seed-variant-11",
			inventoryId: "seed-inv-11",
			pharmacyId: ph("hp"),
			categoryId: c.o1Cold,
			name: "Solmux Carbocisteine",
			genericName: "Carbocisteine",
			brandName: "Solmux",
			brandKey: "Solmux",
			strength: "500mg",
			dosageForm: "Capsule",
			variantLabel: "Box of 20",
			unit: "box",
			price: "142.00",
			quantity: 60,
		},
		{
			productId: "seed-product-12",
			variantId: "seed-variant-12",
			inventoryId: "seed-inv-12",
			pharmacyId: ph("hp"),
			categoryId: c.o1Cold,
			name: "Bioflu Multi-Symptom",
			genericName: "Phenylephrine + Paracetamol",
			brandName: "Bioflu",
			brandKey: "Bioflu",
			strength: "NA",
			dosageForm: "Tablet",
			variantLabel: "Strip of 5",
			unit: "strip",
			price: "88.00",
			quantity: 90,
		},
		{
			productId: "seed-product-13",
			variantId: "seed-variant-13",
			inventoryId: "seed-inv-13",
			pharmacyId: ph("hp"),
			categoryId: c.o1Vitamins,
			name: "Enervon Multivitamins",
			genericName: "Multivitamins",
			brandName: "Enervon",
			brandKey: "Enervon",
			strength: "NA",
			dosageForm: "Tablet",
			variantLabel: "Bottle of 30",
			unit: "bottle",
			price: "195.00",
			quantity: 55,
		},
		{
			productId: "seed-product-14",
			variantId: "seed-variant-14",
			inventoryId: "seed-inv-14",
			pharmacyId: ph("hp"),
			categoryId: c.o1Vitamins,
			name: "Ceelin Ascorbic Acid",
			genericName: "Ascorbic Acid",
			brandName: "Ceelin",
			brandKey: "Ceelin",
			strength: "100mg",
			dosageForm: "Syrup",
			variantLabel: "Bottle 120ml",
			unit: "bottle",
			price: "112.00",
			quantity: 70,
		},
		{
			productId: "seed-product-15",
			variantId: "seed-variant-15",
			inventoryId: "seed-inv-15",
			pharmacyId: ph("hp"),
			categoryId: c.o1Vitamins,
			name: "Enervon-C Vitamin C",
			genericName: "Ascorbic Acid",
			brandName: "Enervon",
			brandKey: "Enervon",
			strength: "500mg",
			dosageForm: "Tablet",
			variantLabel: "Tin of 100",
			unit: "tin",
			price: "225.00",
			quantity: 30,
		},
		{
			productId: "seed-product-16",
			variantId: "seed-variant-16",
			inventoryId: "seed-inv-16",
			pharmacyId: ph("hp"),
			categoryId: c.o1Digestive,
			name: "Diatabs Loperamide",
			genericName: "Loperamide",
			brandName: "Diatabs",
			brandKey: "Diatabs",
			strength: "2mg",
			dosageForm: "Capsule",
			variantLabel: "Strip of 6",
			unit: "strip",
			price: "38.00",
			quantity: 150,
		},
		{
			productId: "seed-product-17",
			variantId: "seed-variant-17",
			inventoryId: "seed-inv-17",
			pharmacyId: ph("hp"),
			categoryId: c.o1Digestive,
			name: "Diatabs ORS",
			genericName: "Oral Rehydration Salts",
			brandName: "Diatabs",
			brandKey: "Diatabs",
			strength: "NA",
			dosageForm: "Powder",
			variantLabel: "Sachet 4.2g",
			unit: "sachet",
			price: "12.00",
			quantity: 300,
		},
		{
			productId: "seed-product-18",
			variantId: "seed-variant-18",
			inventoryId: "seed-inv-18",
			pharmacyId: ph("hp"),
			categoryId: c.o1Digestive,
			name: "RiteMed Omeprazole",
			genericName: "Omeprazole",
			brandName: "RiteMed",
			brandKey: "RiteMed",
			strength: "20mg",
			dosageForm: "Capsule",
			variantLabel: "Bottle of 14",
			unit: "bottle",
			price: "96.00",
			quantity: 40,
		},
		{
			productId: "seed-product-19",
			variantId: "seed-variant-19",
			inventoryId: "seed-inv-19",
			pharmacyId: ph("hp"),
			categoryId: c.o1Pain,
			name: "Alaxan Ibuprofen + Paracetamol",
			genericName: "Ibuprofen + Paracetamol",
			brandName: "Alaxan",
			brandKey: "Alaxan",
			strength: "200mg/325mg",
			dosageForm: "Tablet",
			variantLabel: "Strip of 10",
			unit: "strip",
			price: "72.00",
			quantity: 100,
		},
		{
			productId: "seed-product-20",
			variantId: "seed-variant-20",
			inventoryId: "seed-inv-20",
			pharmacyId: ph("hp"),
			categoryId: c.o1Pain,
			name: "Biogesic Paracetamol",
			genericName: "Paracetamol",
			brandName: "Biogesic",
			brandKey: "Biogesic",
			strength: "250mg",
			dosageForm: "Suspension",
			variantLabel: "Bottle 60ml",
			unit: "bottle",
			price: "95.00",
			quantity: 42,
		},
		{
			productId: "seed-product-21",
			variantId: "seed-variant-21",
			inventoryId: "seed-inv-21",
			pharmacyId: ph("hp"),
			categoryId: c.o1Skin,
			name: "Bactidol Oral Antiseptic",
			genericName: "Hexetidine",
			brandName: "Bactidol",
			brandKey: "Bactidol",
			strength: "0.1%",
			dosageForm: "Solution",
			variantLabel: "Bottle 120ml",
			unit: "bottle",
			price: "185.00",
			quantity: 28,
		},
		{
			productId: "seed-product-22",
			variantId: "seed-variant-22",
			inventoryId: "seed-inv-22",
			pharmacyId: ph("hp"),
			categoryId: c.o1Skin,
			name: "RiteMed Isopropyl Alcohol",
			genericName: "Isopropyl Alcohol",
			brandName: "RiteMed",
			brandKey: "RiteMed",
			strength: "70%",
			dosageForm: "Solution",
			variantLabel: "Bottle 500ml",
			unit: "bottle",
			price: "65.00",
			quantity: 80,
		},
		{
			productId: "seed-product-23",
			variantId: "seed-variant-23",
			inventoryId: "seed-inv-23",
			pharmacyId: ph("hp"),
			categoryId: c.o1Skin,
			name: "Tempra Paracetamol",
			genericName: "Paracetamol",
			brandName: "Tempra",
			brandKey: "Tempra",
			strength: "250mg",
			dosageForm: "Suspension",
			variantLabel: "Bottle 60ml",
			unit: "bottle",
			price: "128.00",
			quantity: 36,
		},
		{
			productId: "seed-product-24",
			variantId: "seed-variant-24",
			inventoryId: "seed-inv-24",
			pharmacyId: ph("hp"),
			categoryId: c.o1Cold,
			name: "Solmux Adult Syrup",
			genericName: "Carbocisteine",
			brandName: "Solmux",
			brandKey: "Solmux",
			strength: "250mg/5ml",
			dosageForm: "Syrup",
			variantLabel: "Bottle 60ml",
			unit: "bottle",
			price: "118.00",
			quantity: 48,
		},
	]

	for (const d of defs) {
		const categoryId = d.categoryId
		const brandIdVal = b(d.brandKey)

		await db
			.insert(medicalProducts)
			.values({
				id: d.productId,
				pharmacyId: d.pharmacyId,
				name: d.name,
				genericName: d.genericName,
				brandName: d.brandName,
				brandId: brandIdVal,
				description: `Seed ${d.genericName} (${d.brandName})`,
				manufacturer: "",
				categoryId,
				requiresPrescription: false,
				supplier: "",
				lowStockThreshold: 5,
				createdAt: now,
				updatedAt: now,
			})
			.onConflictDoUpdate({
				target: medicalProducts.id,
				set: {
					pharmacyId: d.pharmacyId,
					name: d.name,
					genericName: d.genericName,
					brandName: d.brandName,
					brandId: brandIdVal,
					description: `Seed ${d.genericName} (${d.brandName})`,
					categoryId,
					updatedAt: now,
				},
			})

		const primaryImageUrl = SEED_DEFAULT_VARIANT_GALLERY[0] ?? ""

		await db
			.insert(medicalProductVariants)
			.values({
				id: d.variantId,
				productId: d.productId,
				label: d.variantLabel,
				unit: d.unit,
				sortOrder: 0,
				strength: d.strength,
				dosageForm: d.dosageForm,
				imageUrl: primaryImageUrl,
				imageUrls: SEED_DEFAULT_VARIANT_GALLERY,
				createdAt: now,
				updatedAt: now,
			})
			.onConflictDoUpdate({
				target: medicalProductVariants.id,
				set: {
					label: d.variantLabel,
					unit: d.unit,
					strength: d.strength,
					dosageForm: d.dosageForm,
					imageUrl: primaryImageUrl,
					imageUrls: SEED_DEFAULT_VARIANT_GALLERY,
					updatedAt: now,
				},
			})

		await db
			.insert(pharmacyInventory)
			.values({
				id: d.inventoryId,
				pharmacyId: d.pharmacyId,
				productId: d.productId,
				variantId: d.variantId,
				quantity: d.quantity,
				price: d.price,
				isAvailable: true,
				createdAt: now,
				updatedAt: now,
			})
			.onConflictDoUpdate({
				target: pharmacyInventory.id,
				set: {
					variantId: d.variantId,
					quantity: d.quantity,
					price: d.price,
					isAvailable: true,
					updatedAt: now,
				},
			})
	}

	console.log("Seeded medical products, variants, and inventory (24).")
}

async function seed() {
	const auth = getAuth()
	const db = createDBClient()

	const allUsers = buildSeedUsers()
	const ownerIds: Record<string, string> = {}

	for (const u of allUsers) {
		const id = await seedUser(auth, db, u)
		if (u.role === "owner") ownerIds[u.email] = id
	}

	await seedPharmacies(db, ownerIds)
	const brandMap = await seedBrands(db, ownerIds)
	const categories = await seedProductCategories(db, ownerIds)

	const pharmacyMap = { hp: "seed-pharmacy-1", mc: "seed-pharmacy-2" }

	await seedProducts(db, {
		pharmacyMap,
		brandMap,
		categories,
	})

	console.log("Seed complete.")
	process.exit(0)
}

seed().catch(err => {
	console.error(err)
	process.exit(1)
})
