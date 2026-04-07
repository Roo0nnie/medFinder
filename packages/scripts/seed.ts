/**
 * Seed script: creates one user per supported role + a demo pharmacy catalog
 * (brands, owner–brand links, products, variants, inventory) so customers can try
 * centralized brand flows (e.g. same medicine, two brands).
 *
 * Run from repo root: pnpm db:seed
 * Requires: DATABASE_URL (packages/db/.env), BETTER_AUTH_SECRET + BETTER_AUTH_TRUSTED_ORIGINS (apps/web/.env)
 * Prereq: DB migrations applied (brands / owner_brands / medical_products.brand_id).
 */
import "./load-env"

import { eq } from "drizzle-orm"

import { getAuth } from "@repo/auth"
import { createDBClient } from "@repo/db/client"
import {
	brands,
	medicalProductVariants,
	medicalProducts,
	ownerBrands,
	pharmacies,
	pharmacyInventory,
	productCategories,
	users,
} from "@repo/db/schema"

const ROLES = ["user", "admin", "customer", "staff", "owner"] as const
type Role = (typeof ROLES)[number]

const SEED_USERS: Array<{
	email: string
	password: string
	firstName: string
	lastName: string
	middleName: string
	role: Role
}> = [
	{ email: "user@example.com", password: "password123", firstName: "Basic", lastName: "User", middleName: "U", role: "user" },
	{ email: "admin@example.com", password: "password123", firstName: "Admin", lastName: "User", middleName: "A", role: "admin" },
	{ email: "customer@example.com", password: "password123", firstName: "Customer", lastName: "User", middleName: "C", role: "customer" },
	{ email: "staff@example.com", password: "password123", firstName: "Staff", lastName: "User", middleName: "S", role: "staff" },
	{ email: "owner@example.com", password: "password123", firstName: "Owner", lastName: "User", middleName: "O", role: "owner" },
]

/** Stable IDs so re-running the seed does not duplicate rows. */
const DEMO = {
	pharmacyId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
	categoryId: "f47ac10b-58cc-4372-a567-0e02b2c3d47a",
	brandMediCare: "f47ac10b-58cc-4372-a567-0e02b2c3d47b",
	brandWellPlus: "f47ac10b-58cc-4372-a567-0e02b2c3d47c",
	ownerBrandMediCare: "f47ac10b-58cc-4372-a567-0e02b2c3d47d",
	ownerBrandWellPlus: "f47ac10b-58cc-4372-a567-0e02b2c3d47e",
	productParacetamolMediCare: "f47ac10b-58cc-4372-a567-0e02b2c3d47f",
	productParacetamolWellPlus: "f47ac10b-58cc-4372-a567-0e02b2c3d480",
	variant20: "f47ac10b-58cc-4372-a567-0e02b2c3d481",
	variant100: "f47ac10b-58cc-4372-a567-0e02b2c3d482",
	variantBlister: "f47ac10b-58cc-4372-a567-0e02b2c3d483",
	inv20: "f47ac10b-58cc-4372-a567-0e02b2c3d484",
	inv100: "f47ac10b-58cc-4372-a567-0e02b2c3d485",
	invBlister: "f47ac10b-58cc-4372-a567-0e02b2c3d486",
} as const

function normBrandName(name: string): string {
	return name.trim().toLowerCase()
}

async function seedCatalogForOwner(db: ReturnType<typeof createDBClient>, ownerId: string) {
	const existing = await db.select().from(pharmacies).where(eq(pharmacies.id, DEMO.pharmacyId)).limit(1)
	if (existing.length > 0) {
		console.log("Demo catalog already seeded (demo pharmacy id). Skipping catalog inserts.")
		return
	}

	const now = new Date()

	await db.transaction(async tx => {
		await tx.insert(pharmacies).values({
			id: DEMO.pharmacyId,
			ownerId,
			name: "Demo MedFinder Pharmacy",
			description: "Seed data for testing brands, variants, and inventory.",
			address: "123 Health Street",
			city: "Manila",
			municipality: null,
			state: "NCR",
			zipCode: "1000",
			country: "PH",
			certificateStatus: "approved",
			certificateNumber: "SEED-DEMO-001",
			isActive: true,
			latitude: 14.5995,
			longitude: 120.9842,
			phone: "+63-2-0000-0000",
			email: "demo-pharmacy@example.com",
			createdAt: now,
			updatedAt: now,
		})

		await tx.insert(productCategories).values({
			id: DEMO.categoryId,
			ownerId,
			name: "Pain relief",
			description: "OTC pain and fever medicines",
			parentCategoryId: null,
			createdAt: now,
			updatedAt: now,
		})

		await tx.insert(brands).values([
			{
				id: DEMO.brandMediCare,
				name: "MediCare Pharma",
				normalizedName: normBrandName("MediCare Pharma"),
				createdAt: now,
				updatedAt: now,
			},
			{
				id: DEMO.brandWellPlus,
				name: "WellPlus",
				normalizedName: normBrandName("WellPlus"),
				createdAt: now,
				updatedAt: now,
			},
		])

		await tx.insert(ownerBrands).values([
			{
				id: DEMO.ownerBrandMediCare,
				ownerId,
				brandId: DEMO.brandMediCare,
				createdAt: now,
				updatedAt: now,
			},
			{
				id: DEMO.ownerBrandWellPlus,
				ownerId,
				brandId: DEMO.brandWellPlus,
				createdAt: now,
				updatedAt: now,
			},
		])

		await tx.insert(medicalProducts).values([
			{
				id: DEMO.productParacetamolMediCare,
				pharmacyId: DEMO.pharmacyId,
				name: "Paracetamol 500mg Tablets",
				genericName: "Paracetamol",
				brandName: "MediCare Pharma",
				brandId: DEMO.brandMediCare,
				description: "Seed product A — same generic as WellPlus line for brand-grouping demos.",
				manufacturer: "MediCare Pharma",
				categoryId: DEMO.categoryId,
				dosageForm: "tablet",
				strength: "500mg",
				unit: "tablet",
				requiresPrescription: false,
				lowStockThreshold: 10,
				createdAt: now,
				updatedAt: now,
			},
			{
				id: DEMO.productParacetamolWellPlus,
				pharmacyId: DEMO.pharmacyId,
				name: "Paracetamol 500mg Tablets",
				genericName: "Paracetamol",
				brandName: "WellPlus",
				brandId: DEMO.brandWellPlus,
				description: "Seed product B — same medicine & strength, different brandId for UI testing.",
				manufacturer: "WellPlus Labs",
				categoryId: DEMO.categoryId,
				dosageForm: "tablet",
				strength: "500mg",
				unit: "tablet",
				requiresPrescription: false,
				lowStockThreshold: 10,
				createdAt: now,
				updatedAt: now,
			},
		])

		await tx.insert(medicalProductVariants).values([
			{
				id: DEMO.variant20,
				productId: DEMO.productParacetamolMediCare,
				label: "20 tablet strip",
				sortOrder: 0,
				createdAt: now,
				updatedAt: now,
			},
			{
				id: DEMO.variant100,
				productId: DEMO.productParacetamolMediCare,
				label: "100 tablet bottle",
				sortOrder: 1,
				createdAt: now,
				updatedAt: now,
			},
			{
				id: DEMO.variantBlister,
				productId: DEMO.productParacetamolWellPlus,
				label: "Blister pack (10 tablets)",
				sortOrder: 0,
				createdAt: now,
				updatedAt: now,
			},
		])

		await tx.insert(pharmacyInventory).values([
			{
				id: DEMO.inv20,
				pharmacyId: DEMO.pharmacyId,
				productId: DEMO.productParacetamolMediCare,
				variantId: DEMO.variant20,
				quantity: 48,
				price: "45.00",
				discountPrice: null,
				isAvailable: true,
				createdAt: now,
				updatedAt: now,
			},
			{
				id: DEMO.inv100,
				pharmacyId: DEMO.pharmacyId,
				productId: DEMO.productParacetamolMediCare,
				variantId: DEMO.variant100,
				quantity: 12,
				price: "199.00",
				discountPrice: "179.00",
				isAvailable: true,
				createdAt: now,
				updatedAt: now,
			},
			{
				id: DEMO.invBlister,
				pharmacyId: DEMO.pharmacyId,
				productId: DEMO.productParacetamolWellPlus,
				variantId: DEMO.variantBlister,
				quantity: 30,
				price: "52.50",
				discountPrice: null,
				isAvailable: true,
				createdAt: now,
				updatedAt: now,
			},
		])
	})

	console.log("")
	console.log("Demo catalog seeded:")
	console.log(`  Pharmacy: Demo MedFinder Pharmacy (${DEMO.pharmacyId})`)
	console.log("  Brands: MediCare Pharma, WellPlus (linked to owner)")
	console.log("  Products: two Paracetamol 500mg rows (same generic, different brandId) + variants + inventory")
	console.log("  Try: landing/search → same medicine should offer a brand choice; brandId groups catalog rows.")
	console.log("")
}

async function seed() {
	const auth = getAuth()
	const db = createDBClient()

	for (const u of SEED_USERS) {
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
			continue
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
		} catch (err) {
			console.error(`Failed to create ${u.email}:`, err instanceof Error ? err.message : err)
		}
	}

	const ownerRow = await db.select().from(users).where(eq(users.email, "owner@example.com")).limit(1)
	if (ownerRow.length === 0) {
		console.log("owner@example.com not found; skipping demo catalog seed.")
	} else {
		try {
			await seedCatalogForOwner(db, ownerRow[0]!.id)
		} catch (err) {
			console.error(
				"Demo catalog seed failed (did you run DB migrations?).",
				err instanceof Error ? err.message : err
			)
		}
	}

	console.log("Seed complete.")
	process.exit(0)
}

seed().catch(err => {
	console.error(err)
	process.exit(1)
})
