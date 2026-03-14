/**
 * Seed script: creates admin, customer, 5 owners, 5 staff per owner (25 staff), and sample catalog.
 * Run from repo root: pnpm dev:seed
 * Requires: DATABASE_URL (packages/db/.env), BETTER_AUTH_SECRET + BETTER_AUTH_TRUSTED_ORIGINS (apps/web/.env)
 */
import "./load-env"

import { eq } from "drizzle-orm"

import { getAuth } from "@repo/auth"
import { createDBClient } from "@repo/db/client"
import {
	medicalProductVariants,
	medicalProducts,
	pharmacies,
	pharmacyInventory,
	productCategories,
	staff,
	users,
} from "@repo/db/schema"

const SEED_OWNERS = [
	{ email: "owner@example.com", password: "password123", firstName: "Maria", lastName: "Santos", middleName: "R", role: "owner" as const },
	{ email: "owner2@example.com", password: "password123", firstName: "Jose", lastName: "Reyes", middleName: "M", role: "owner" as const },
	{ email: "owner3@example.com", password: "password123", firstName: "Ana", lastName: "Cruz", middleName: "L", role: "owner" as const },
	{ email: "owner4@example.com", password: "password123", firstName: "Carlos", lastName: "Dela Cruz", middleName: "G", role: "owner" as const },
	{ email: "owner5@example.com", password: "password123", firstName: "Elena", lastName: "Garcia", middleName: "S", role: "owner" as const },
]

const DEPARTMENTS = ["Pharmacy", "Inventory", "Sales", "Customer Service", "Operations"] as const
const POSITIONS = ["Pharmacist", "Inventory Clerk", "Sales Associate", "Customer Rep", "Operations Lead"] as const

const CATEGORY_NAMES = [
	"General Medicines",
	"Vitamins & Supplements",
	"First Aid & Wound Care",
	"Personal Care",
	"Medical Devices",
] as const

function buildStaffSeed(ownerIndex: number, staffIndex: number) {
	const o = ownerIndex + 1
	const s = staffIndex + 1
	return {
		email: `staff-o${o}-${s}@example.com`,
		password: "password123",
		firstName: ["Luis", "Rosa", "Miguel", "Carmen", "Pedro"][staffIndex]!,
		lastName: ["Villanueva", "Mendoza", "Torres", "Ramos", "Flores"][staffIndex]!,
		middleName: ["A", "B", "C", "D", "E"][staffIndex]!,
		role: "staff" as const,
		ownerIndex,
		department: DEPARTMENTS[staffIndex]!,
		position: POSITIONS[staffIndex]!,
	}
}

const SEED_STAFF = Array.from({ length: 5 }, (_, o) =>
	Array.from({ length: 5 }, (_, s) => buildStaffSeed(o, s))
).flat()

const SEED_USERS = [
	{ email: "admin@example.com", password: "password123", firstName: "Admin", lastName: "User", middleName: "A", role: "admin" as const },
	...SEED_OWNERS,
	{ email: "customer@example.com", password: "password123", firstName: "Customer", lastName: "User", middleName: "C", role: "customer" as const },
	...SEED_STAFF,
]

async function seed() {
	const auth = getAuth()
	const db = createDBClient()

	const ownerIds: string[] = []
	const staffUserIds: string[] = []

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
			if (u.role === "owner") ownerIds.push(existing[0]!.id)
			if (u.role === "staff" && "ownerIndex" in u) staffUserIds.push(existing[0]!.id)
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
			if (u.role === "owner") ownerIds.push(userId)
			if (u.role === "staff" && "ownerIndex" in u) staffUserIds.push(userId)
		} catch (err) {
			console.error(`Failed to create ${u.email}:`, err instanceof Error ? err.message : err)
		}
	}

	// Create staff table rows: each staff user is linked to their owner
	for (let i = 0; i < SEED_STAFF.length; i++) {
		const s = SEED_STAFF[i]!
		const ownerId = ownerIds[s.ownerIndex]
		const userId = staffUserIds[i]
		if (!ownerId || !userId) continue
		const staffId = `staff-seed-o${s.ownerIndex + 1}-${(i % 5) + 1}`
		const existingStaff = await db.select().from(staff).where(eq(staff.id, staffId)).limit(1)
		if (existingStaff.length > 0) {
			await db
				.update(staff)
				.set({
					userId,
					ownerId,
					department: s.department,
					position: s.position,
					updatedAt: new Date(),
				})
				.where(eq(staff.id, staffId))
			console.log(`Updated staff record: ${s.email} -> owner ${s.ownerIndex + 1}`)
		} else {
			await db.insert(staff).values({
				id: staffId,
				userId,
				ownerId,
				department: s.department,
				position: s.position,
				isActive: true,
			})
			console.log(`Created staff record: ${s.email} -> owner ${s.ownerIndex + 1}`)
		}
	}

	// Create 5 categories per owner
	for (let o = 0; o < ownerIds.length; o++) {
		const ownerId = ownerIds[o]!
		for (let c = 0; c < CATEGORY_NAMES.length; c++) {
			const categoryId = `cat-o${o + 1}-${c + 1}`
			const name = CATEGORY_NAMES[c]!
			const existingCat = await db
				.select()
				.from(productCategories)
				.where(eq(productCategories.id, categoryId))
				.limit(1)
			if (existingCat.length === 0) {
				await db.insert(productCategories).values({
					id: categoryId,
					ownerId,
					name,
					description: `${name} category`,
				})
				console.log(`Created category ${name} for owner ${o + 1}`)
			} else {
				await db
					.update(productCategories)
					.set({ ownerId, name, updatedAt: new Date() })
					.where(eq(productCategories.id, categoryId))
			}
		}
	}

	// Pharmacies: one per owner (store-1 .. store-5)
	const PHARMACY_SEED = [
		{ id: "store-1", name: "Sunrise Pharmacy", ownerIndex: 0 },
		{ id: "store-2", name: "Reyes Drugstore", ownerIndex: 1 },
		{ id: "store-3", name: "Cruz Health Mart", ownerIndex: 2 },
		{ id: "store-4", name: "Dela Cruz Pharmacy", ownerIndex: 3 },
		{ id: "store-5", name: "Garcia Family Pharmacy", ownerIndex: 4 },
	] as const

	for (const ph of PHARMACY_SEED) {
		const ownerId = ownerIds[ph.ownerIndex]
		if (!ownerId) continue
		const existingPh = await db.select().from(pharmacies).where(eq(pharmacies.id, ph.id)).limit(1)
		if (existingPh.length === 0) {
			await db.insert(pharmacies).values({
				id: ph.id,
				ownerId,
				name: ph.name,
				description: "Community pharmacy providing essential medicines",
				address: `${ph.ownerIndex + 1}00 Main St`,
				city: "Quezon City",
				state: "NCR",
				zipCode: "1100",
				country: "PH",
				phone: "+63 917 000 0000",
				email: `contact@${ph.id}.ph`,
				website: `https://${ph.id}.ph`,
				operatingHours: "Mon-Sun 8am-9pm",
				isActive: true,
			})
			console.log(`Created pharmacy ${ph.name}`)
		}
	}

	// Products: at least 3, with 2 having variants (across the 5 owners)
	// Product 1: no variant (owner 1). Product 2: with variants (owner 2). Product 3: with variants (owner 3).
	const PRODUCT_SEED = [
		{
			id: "prod-1",
			pharmacyId: "store-1",
			categoryId: "cat-o1-1",
			name: "Paracetamol 500mg",
			brandName: "Generic",
			genericName: "Paracetamol",
			description: "Pain reliever and fever reducer",
			manufacturer: "MediCorp",
			dosageForm: "Tablet",
			strength: "500mg",
			unit: "tablet",
			variants: null as null | { id: string; label: string; sortOrder: number; price: string; quantity: number }[],
		},
		{
			id: "prod-2",
			pharmacyId: "store-2",
			categoryId: "cat-o2-1",
			name: "Alcohol 70%",
			brandName: "Generics",
			genericName: "Ethanol",
			description: "Rubbing alcohol for disinfection. Available in 100ml and 500ml.",
			manufacturer: "MedSupply",
			dosageForm: "Liquid",
			strength: "70%",
			unit: "bottle",
			variants: [
				{ id: "var-p2-100", label: "100ml bottle", sortOrder: 0, price: "35.00", quantity: 20 },
				{ id: "var-p2-500", label: "500ml bottle", sortOrder: 1, price: "120.00", quantity: 8 },
			],
		},
		{
			id: "prod-3",
			pharmacyId: "store-3",
			categoryId: "cat-o3-1",
			name: "Paracetamol Syrup",
			brandName: "Biogesic",
			genericName: "Paracetamol",
			description: "Fever and pain reliever for children. Different volumes available.",
			manufacturer: "Unilab",
			dosageForm: "Syrup",
			strength: "",
			unit: "bottle",
			variants: [
				{ id: "var-p3-30", label: "30ml", sortOrder: 0, price: "45.00", quantity: 20 },
				{ id: "var-p3-15", label: "15ml", sortOrder: 1, price: "28.00", quantity: 35 },
			],
		},
	]

	for (const prod of PRODUCT_SEED) {
		const existingProd = await db.select().from(medicalProducts).where(eq(medicalProducts.id, prod.id)).limit(1)
		if (existingProd.length === 0) {
			await db.insert(medicalProducts).values({
				id: prod.id,
				pharmacyId: prod.pharmacyId,
				name: prod.name,
				brandName: prod.brandName,
				genericName: prod.genericName,
				description: prod.description,
				manufacturer: prod.manufacturer,
				categoryId: prod.categoryId,
				dosageForm: prod.dosageForm,
				strength: prod.strength,
				unit: prod.unit,
				requiresPrescription: false,
				lowStockThreshold: 10,
			})
			console.log(`Created product ${prod.name}`)
		}

		// Variants (for products that have them)
		if (prod.variants) {
			for (const v of prod.variants) {
				const existingVar = await db
					.select()
					.from(medicalProductVariants)
					.where(eq(medicalProductVariants.id, v.id))
					.limit(1)
				if (existingVar.length === 0) {
					await db.insert(medicalProductVariants).values({
						id: v.id,
						productId: prod.id,
						label: v.label,
						sortOrder: v.sortOrder,
					})
					console.log(`  Created variant ${v.label} for ${prod.name}`)
				}
			}
		}
	}

	// Inventory: one row per product (default) or per variant
	const inventoryRows: { id: string; pharmacyId: string; productId: string; variantId: string | null; quantity: number; price: string }[] = [
		{ id: "inv-1", pharmacyId: "store-1", productId: "prod-1", variantId: null, quantity: 120, price: "5.00" },
		{ id: "inv-p2-100", pharmacyId: "store-2", productId: "prod-2", variantId: "var-p2-100", quantity: 20, price: "35.00" },
		{ id: "inv-p2-500", pharmacyId: "store-2", productId: "prod-2", variantId: "var-p2-500", quantity: 8, price: "120.00" },
		{ id: "inv-p3-30", pharmacyId: "store-3", productId: "prod-3", variantId: "var-p3-30", quantity: 20, price: "45.00" },
		{ id: "inv-p3-15", pharmacyId: "store-3", productId: "prod-3", variantId: "var-p3-15", quantity: 35, price: "28.00" },
	]

	for (const inv of inventoryRows) {
		const existingInv = await db
			.select()
			.from(pharmacyInventory)
			.where(eq(pharmacyInventory.id, inv.id))
			.limit(1)
		if (existingInv.length === 0) {
			await db.insert(pharmacyInventory).values({
				id: inv.id,
				pharmacyId: inv.pharmacyId,
				productId: inv.productId,
				variantId: inv.variantId,
				quantity: inv.quantity,
				price: inv.price,
				isAvailable: true,
			})
			console.log(`Created inventory ${inv.id} (product ${inv.productId}${inv.variantId ? `, variant ${inv.variantId}` : ""})`)
		}
	}

	if (ownerIds.length === 0) {
		console.warn("No owner users found; skipped seeding pharmacies/products/inventory.")
	}

	console.log("Seed complete (users, 5 pharmacies, 3 products with 2 having variants, inventory).")
	process.exit(0)
}

seed().catch(err => {
	console.error(err)
	process.exit(1)
})
