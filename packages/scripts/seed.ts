/**
 * Seed script: creates 4 users (admin, owner, staff, customer) and optional products/pharmacies for development.
 * Run from repo root: pnpm dev:seed
 * Requires: DATABASE_URL (packages/db/.env), BETTER_AUTH_SECRET + BETTER_AUTH_TRUSTED_ORIGINS (apps/web/.env)
 */
import "./load-env"

import { eq } from "drizzle-orm"

import { getAuth } from "@repo/auth"
import { createDBClient } from "@repo/db/client"
import {
	medicalProducts,
	pharmacies,
	pharmacyInventory,
	pharmacyStaff,
	productCategories,
	staff,
	users,
} from "@repo/db/schema"

const SEED_USERS = [
	{
		email: "admin@example.com",
		password: "password123",
		firstName: "Admin",
		lastName: "User",
		middleName: "A",
		role: "admin" as const,
	},
	{
		email: "owner@example.com",
		password: "password123",
		firstName: "Owner",
		lastName: "User",
		middleName: "O",
		role: "owner" as const,
	},
	{
		email: "staff@example.com",
		password: "password123",
		firstName: "Staff",
		lastName: "User",
		middleName: "S",
		role: "staff" as const,
	},
	{
		email: "customer@example.com",
		password: "password123",
		firstName: "Customer",
		lastName: "User",
		middleName: "C",
		role: "customer" as const,
	},
]

// Static data for pharmacies and products (matches landing page data)
const SEED_PHARMACIES = [
	{ id: "store-1", name: "Bulan Community Pharmacy", address: "T. De Castro St, Zone 8", city: "Bulan", municipality: "Bulan, Sorsogon" },
	{ id: "store-2", name: "MedCare Pharmacy", address: "Rizal St, Poblacion", city: "Bulan", municipality: "Bulan, Sorsogon" },
	{ id: "store-3", name: "Manila Health Plus", address: "Ermita, Manila", city: "Manila", municipality: "Manila, NCR" },
	{ id: "store-4", name: "Cebu MedExpress", address: "Colon St, Cebu City", city: "Cebu City", municipality: "Cebu City, Cebu" },
	{ id: "store-5", name: "Davao Wellness Pharmacy", address: "San Pedro St, Davao City", city: "Davao City", municipality: "Davao City, Davao del Sur" },
	{ id: "store-6", name: "Iloilo Community Pharmacy", address: "Jaro, Iloilo City", city: "Iloilo City", municipality: "Iloilo City, Iloilo" },
	{ id: "store-7", name: "Baguio Mountain Med", address: "Session Rd, Baguio", city: "Baguio City", municipality: "Baguio City, Benguet" },
	{ id: "store-8", name: "CDO Family Pharmacy", address: "Cogon, CDO", city: "Cagayan de Oro", municipality: "Cagayan de Oro, Misamis Oriental" },
	{ id: "store-9", name: "Bacolod Health Hub", address: "Lacson St, Bacolod", city: "Bacolod City", municipality: "Bacolod City, Negros Occidental" },
	{ id: "store-10", name: "Pampanga MedCare", address: "Angeles City Central", city: "Angeles City", municipality: "Angeles City, Pampanga" },
] as const

const SEED_PRODUCTS = [
	{ id: "prod-1", name: "Paracetamol 500mg", brand: "Generic", category: "Pain Relief", dosage: "500mg", description: "Pain reliever and fever reducer", price: 5.0, quantity: 150, supplier: "PharmaCorp", storeId: "store-1", unit: "strip" },
	{ id: "prod-2", name: "Amoxicillin 500mg", brand: "RiteMed", category: "Antibiotics", dosage: "500mg", description: "Antibiotic capsule", price: 12.0, quantity: 45, supplier: "Unilab", storeId: "store-1", unit: "capsule" },
	{ id: "prod-3", name: "Ibuprofen 200mg", brand: "Medicol", category: "Pain Relief", dosage: "200mg", description: "Anti-inflammatory pain reliever", price: 8.0, quantity: 8, supplier: "United Lab", storeId: "store-1", unit: "tablet" },
	{ id: "prod-4", name: "Bandages Assorted", brand: "3M", category: "First Aid", dosage: undefined, description: "Adhesive bandages, assorted sizes", price: 25.0, quantity: 30, supplier: "MedSupply", storeId: "store-2", unit: "box" },
	{ id: "prod-5", name: "Digital Thermometer", brand: "Omron", category: "Medical Devices", description: "Digital fever thermometer", price: 150.0, quantity: 12, supplier: "HealthTech", storeId: "store-2", unit: "piece" },
	{ id: "prod-6", name: "Insulin Glargine", brand: "Lantus", category: "Diabetes", dosage: "100 units/ml", description: "Long-acting insulin", price: 450.0, quantity: 5, supplier: "Sanofi", storeId: "store-3", unit: "vial" },
	{ id: "prod-7", name: "Metformin 500mg", brand: "Glucophage", category: "Diabetes", dosage: "500mg", description: "Diabetes medication", price: 3.5, quantity: 100, supplier: "Unilab", storeId: "store-3", unit: "tablet" },
	{ id: "prod-8", name: "Vitamin C 1000mg", brand: "Enervon", category: "Vitamins", dosage: "1000mg", description: "Immune support supplement", price: 18.0, quantity: 60, supplier: "Unilab", storeId: "store-4", unit: "tablet" },
	{ id: "prod-9", name: "Cetirizine 10mg", brand: "Allerkid", category: "Antihistamine", dosage: "10mg", description: "Allergy relief tablet", price: 4.0, quantity: 25, supplier: "United Lab", storeId: "store-4", unit: "tablet" },
	{ id: "prod-10", name: "Loperamide 2mg", brand: "Diatabs", category: "Digestive", dosage: "2mg", description: "Anti-diarrheal", price: 2.5, quantity: 5, supplier: "PharmaCorp", storeId: "store-5", unit: "capsule" },
	{ id: "prod-11", name: "Paracetamol 500mg", brand: "Biogesic", category: "Pain Relief", dosage: "500mg", description: "Pain reliever and fever reducer", price: 6.0, quantity: 80, supplier: "Unilab", storeId: "store-5", unit: "strip" },
	{ id: "prod-12", name: "Omeprazole 20mg", brand: "Omepron", category: "Digestive", dosage: "20mg", description: "Acid reducer", price: 7.0, quantity: 40, supplier: "RiteMed", storeId: "store-2", unit: "tablet" },
	{ id: "prod-13", name: "Alcohol 70%", brand: "Generics", category: "First Aid", description: "Rubbing alcohol for disinfection", price: 35.0, quantity: 20, supplier: "MedSupply", storeId: "store-6", unit: "bottle" },
	{ id: "prod-14", name: "Face Mask Surgical", brand: "3M", category: "Protective Equipment", description: "3-ply surgical mask, box of 50", price: 120.0, quantity: 15, supplier: "HealthTech", storeId: "store-7", unit: "box" },
	{ id: "prod-15", name: "Multivitamin", brand: "Centrum", category: "Vitamins", description: "Daily multivitamin supplement", price: 250.0, quantity: 10, supplier: "Pfizer", storeId: "store-8", unit: "bottle" },
	{ id: "prod-16", name: "Ibuprofen 200mg", brand: "Medicol", category: "Pain Relief", dosage: "200mg", description: "Anti-inflammatory pain reliever", price: 8.0, quantity: 15, supplier: "United Lab", storeId: "store-10", unit: "tablet" },
] as const

function categoryToId(name: string): string {
	return "cat-" + name.toLowerCase().replace(/\s+/g, "-")
}

async function seed() {
	const auth = getAuth()
	const db = createDBClient()

	let ownerId: string | undefined
	let staffUserId: string | undefined

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

			// Capture IDs for owner and staff users
			if (u.role === "owner") {
				ownerId = existing[0]!.id
			}
			if (u.role === "staff") {
				staffUserId = existing[0]!.id
			}
			continue
		}
		try {
			// Better Auth API types only include base fields; additionalFields (firstName, etc.) are valid at runtime
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

			// Capture IDs for owner and staff users
			if (u.role === "owner") {
				ownerId = userId
			}
			if (u.role === "staff") {
				staffUserId = userId
			}
		} catch (err) {
			console.error(`Failed to create ${u.email}:`, err instanceof Error ? err.message : err)
		}
	}

	// Seed pharmacies, product categories, medical products, and pharmacy inventory (optional)
	if (!ownerId) {
		console.log("Skipping products/pharmacies seed: owner user not found.")
		process.exit(0)
	}

	// Seed a staff profile linked to the owner (1 owner -> many staff, staff -> 1 owner)
	if (staffUserId) {
		const existingStaff = await db
			.select()
			.from(staff)
			.where(eq(staff.userId, staffUserId))
			.limit(1)

		if (existingStaff.length === 0) {
			const staffId = "seed-staff-1"
			await db.insert(staff).values({
				id: staffId,
				userId: staffUserId,
				ownerId,
				department: "Pharmacy",
				position: "Pharmacist",
				specialization: "General Practice",
				bio: "Seed staff member for development.",
				phone: "+63-900-000-0000",
				isActive: true,
			})
			console.log("Created staff profile linked to owner.")
		}
	}

	// Product categories (unique from products)
	const categoryNames = Array.from(new Set(SEED_PRODUCTS.map((p) => p.category)))
	for (const name of categoryNames) {
		const id = categoryToId(name)
		const existing = await db.select().from(productCategories).where(eq(productCategories.id, id)).limit(1)
		if (existing.length === 0) {
			await db.insert(productCategories).values({ id, name })
			console.log(`Created category: ${name}`)
		}
	}

	// Medical products
	for (const p of SEED_PRODUCTS) {
		const existing = await db.select().from(medicalProducts).where(eq(medicalProducts.id, p.id)).limit(1)
		if (existing.length === 0) {
			await db.insert(medicalProducts).values({
				id: p.id,
				name: p.name,
				brandName: p.brand,
				description: "description" in p ? p.description ?? null : null,
				categoryId: categoryToId(p.category),
				strength: "dosage" in p ? (p.dosage ?? null) : null,
				unit: p.unit ?? "piece",
			})
			console.log(`Created product: ${p.name}`)
		}
	}

	// Pharmacies
	for (const s of SEED_PHARMACIES) {
		const existing = await db.select().from(pharmacies).where(eq(pharmacies.id, s.id)).limit(1)
		if (existing.length === 0) {
			await db.insert(pharmacies).values({
				id: s.id,
				ownerId,
				name: s.name,
				address: s.address,
				city: s.city,
				state: s.municipality,
				zipCode: "0000",
				country: "US",
			})
			console.log(`Created pharmacy: ${s.name}`)
		}
	}

	// Link the seeded staff (if any) to all seeded pharmacies via pharmacy_staff
	if (staffUserId) {
		const staffRow = await db.select().from(staff).where(eq(staff.userId, staffUserId)).limit(1)
		const staffId = staffRow[0]?.id

		if (staffId) {
			for (const s of SEED_PHARMACIES) {
				const pivotId = `ps-${staffId}-${s.id}`
				const existingPivot = await db
					.select()
					.from(pharmacyStaff)
					.where(eq(pharmacyStaff.id, pivotId))
					.limit(1)

				if (existingPivot.length === 0) {
					await db.insert(pharmacyStaff).values({
						id: pivotId,
						pharmacyId: s.id,
						staffId,
					})
				}
			}
			console.log("Linked staff to seeded pharmacies.")
		}
	}

	// Pharmacy inventory (one row per product)
	for (const p of SEED_PRODUCTS) {
		const invId = `inv-${p.storeId}-${p.id}`
		const existing = await db.select().from(pharmacyInventory).where(eq(pharmacyInventory.id, invId)).limit(1)
		if (existing.length === 0) {
			await db.insert(pharmacyInventory).values({
				id: invId,
				pharmacyId: p.storeId,
				productId: p.id,
				quantity: p.quantity,
				price: String(p.price),
			})
		}
	}
	console.log("Seed complete (users + products/pharmacies).")
	process.exit(0)
}

seed().catch(err => {
	console.error(err)
	process.exit(1)
})
