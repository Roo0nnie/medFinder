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

const PHARMACY_COUNT = 20
const PRODUCT_COUNT = 20

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

	// Pharmacies: 20 total (store-1 .. store-20), distributed across the 5 owners.
	const pharmacyNamePrefixes = [
		"Sunrise",
		"Reyes",
		"Cruz",
		"Dela Cruz",
		"Garcia",
		"Harbor",
		"River",
		"Green",
		"Metro",
		"Prime",
	] as const
	const pharmacyNameSuffixes = ["Pharmacy", "Drugstore", "Health Mart", "Care Pharmacy", "Family Pharmacy"] as const

	const PHARMACY_SEED = Array.from({ length: PHARMACY_COUNT }, (_, i) => {
		const index = i + 1
		const ownerIndex = i % Math.max(ownerIds.length, 1)
		const prefix = pharmacyNamePrefixes[i % pharmacyNamePrefixes.length]!
		const suffix = pharmacyNameSuffixes[i % pharmacyNameSuffixes.length]!
		return { id: `store-${index}`, name: `${prefix} ${suffix}`, ownerIndex }
	})

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
				address: `${ph.ownerIndex + 1}${String(ph.id).replace("store-", "").padStart(2, "0")} Main St`,
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
		} else {
			await db
				.update(pharmacies)
				.set({ ownerId, name: ph.name, updatedAt: new Date() })
				.where(eq(pharmacies.id, ph.id))
		}
	}

	// Products: 20 total (prod-1 .. prod-20), linked to pharmacies and owner categories.
	const productNames = [
		{ name: "Paracetamol", genericName: "Paracetamol", dosageForm: "Tablet", strength: "500mg", unit: "tablet", manufacturer: "MediCorp", brandName: "Generic" },
		{ name: "Ibuprofen", genericName: "Ibuprofen", dosageForm: "Tablet", strength: "200mg", unit: "tablet", manufacturer: "MediCorp", brandName: "Generic" },
		{ name: "Cetirizine", genericName: "Cetirizine", dosageForm: "Tablet", strength: "10mg", unit: "tablet", manufacturer: "MedSupply", brandName: "Generic" },
		{ name: "Loperamide", genericName: "Loperamide", dosageForm: "Capsule", strength: "2mg", unit: "capsule", manufacturer: "MedSupply", brandName: "Generic" },
		{ name: "Alcohol", genericName: "Ethanol", dosageForm: "Liquid", strength: "70%", unit: "bottle", manufacturer: "MedSupply", brandName: "Generics" },
		{ name: "Vitamin C", genericName: "Ascorbic Acid", dosageForm: "Tablet", strength: "500mg", unit: "tablet", manufacturer: "NutriHealth", brandName: "Generic" },
		{ name: "Zinc", genericName: "Zinc", dosageForm: "Tablet", strength: "10mg", unit: "tablet", manufacturer: "NutriHealth", brandName: "Generic" },
		{ name: "Bandage Roll", genericName: "Bandage", dosageForm: "Device", strength: "", unit: "roll", manufacturer: "CarePlus", brandName: "CarePlus" },
		{ name: "Antiseptic Solution", genericName: "Povidone-Iodine", dosageForm: "Liquid", strength: "10%", unit: "bottle", manufacturer: "CarePlus", brandName: "CarePlus" },
		{ name: "Digital Thermometer", genericName: "Thermometer", dosageForm: "Device", strength: "", unit: "piece", manufacturer: "HealthTech", brandName: "HealthTech" },
	] as const

	const PRODUCT_SEED = Array.from({ length: PRODUCT_COUNT }, (_, i) => {
		const index = i + 1
		const ph = PHARMACY_SEED[i % PHARMACY_SEED.length]!
		const ownerIndex = ph.ownerIndex
		const p = productNames[i % productNames.length]!
		const categoryId = `cat-o${ownerIndex + 1}-1`
		return {
			id: `prod-${index}`,
			pharmacyId: ph.id,
			categoryId,
			name: `${p.name}${p.strength ? ` ${p.strength}` : ""}`.trim(),
			brandName: p.brandName,
			genericName: p.genericName,
			description: `${p.name} for everyday health needs`,
			manufacturer: p.manufacturer,
			dosageForm: p.dosageForm,
			strength: p.strength,
			unit: p.unit,
		}
	})

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
		} else {
			await db
				.update(medicalProducts)
				.set({
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
					updatedAt: new Date(),
				})
				.where(eq(medicalProducts.id, prod.id))
		}
	}

	// Inventory: one row per product
	const inventoryRows: {
		id: string
		pharmacyId: string
		productId: string
		variantId: string | null
		quantity: number
		price: string
	}[] = PRODUCT_SEED.map((p, i) => {
		const basePrice = 10 + (i % 10) * 5
		const quantity = 25 + (i % 8) * 10
		return {
			id: `inv-${p.id}`,
			pharmacyId: p.pharmacyId,
			productId: p.id,
			variantId: null,
			quantity,
			price: `${basePrice}.00`,
		}
	})

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

	console.log(`Seed complete (users, ${PHARMACY_COUNT} pharmacies, ${PRODUCT_COUNT} products, inventory).`)
	process.exit(0)
}

seed().catch(err => {
	console.error(err)
	process.exit(1)
})
