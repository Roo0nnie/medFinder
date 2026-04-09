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

import { createHash } from "node:crypto"
import { eq } from "drizzle-orm"

import { getAuth } from "@repo/auth"
import { createDBClient } from "@repo/db/client"
import {
	brands,
	medicalProductVariants,
	medicalProducts,
	ownerBrands,
	pharmacies,
	pharmacyStaff,
	pharmacyInventory,
	productCategories,
	staff,
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

function normBrandName(name: string): string {
	return name.trim().toLowerCase()
}

function uuidFromKey(key: string): string {
	const hex = createHash("sha1").update(key).digest("hex").slice(0, 32)
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

function stableId(prefix: string, key: string): string {
	return uuidFromKey(`${prefix}:${key}`)
}

function pick<T>(list: readonly T[], n: number): T {
	return list[n % list.length]!
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

async function ensureBrandId(tx: ReturnType<typeof createDBClient>, name: string, now: Date): Promise<string> {
	const normalizedName = normBrandName(name)
	const existing = await tx.select().from(brands).where(eq(brands.normalizedName, normalizedName)).limit(1)
	if (existing.length > 0) return existing[0]!.id

	const brandId = stableId("brand", normalizedName)
	await tx.insert(brands).values({
		id: brandId,
		name,
		normalizedName,
		createdAt: now,
		updatedAt: now,
	})
	return brandId
}

async function ensureOwnerBrandLink(
	tx: ReturnType<typeof createDBClient>,
	ownerId: string,
	brandId: string,
	now: Date
): Promise<void> {
	const linkId = stableId("owner_brand", `${ownerId}:${brandId}`)
	const existing = await tx.select().from(ownerBrands).where(eq(ownerBrands.id, linkId)).limit(1)
	if (existing.length > 0) return
	await tx.insert(ownerBrands).values({
		id: linkId,
		ownerId,
		brandId,
		createdAt: now,
		updatedAt: now,
	})
}

async function seedOwnerCatalog(opts: {
	db: ReturnType<typeof createDBClient>
	owner: { id: string; email: string; index: number }
	staffUserIds: string[]
}) {
	const { db, owner, staffUserIds } = opts

	const now = new Date()
	const pharmacyId = stableId("pharmacy", owner.id)
	const categoryPainReliefId = stableId("category", `${owner.id}:pain_relief`)
	const categoryColdFluId = stableId("category", `${owner.id}:cold_flu`)
	const categorySkinCareId = stableId("category", `${owner.id}:skin_care`)
	const categoryPrescriptionMedsId = stableId("category", `${owner.id}:prescription_meds`)

	await db.transaction(async tx => {
		const existingPharmacy = await tx.select().from(pharmacies).where(eq(pharmacies.id, pharmacyId)).limit(1)
		if (existingPharmacy.length === 0) {
			await tx.insert(pharmacies).values({
				id: pharmacyId,
				ownerId: owner.id,
				name: `Owner ${owner.index} Pharmacy`,
				description: `Seed pharmacy for ${owner.email}.`,
				address: `${100 + owner.index} Health Street`,
				city: "Manila",
				municipality: null,
				state: "NCR",
				zipCode: "1000",
				country: "PH",
				certificateStatus: "approved",
				certificateNumber: `SEED-OWNER-${owner.index.toString().padStart(2, "0")}`,
				isActive: true,
				latitude: 14.5995 + owner.index * 0.01,
				longitude: 120.9842 + owner.index * 0.01,
				phone: `+63-2-0000-00${owner.index}0`,
				email: `owner${owner.index}-pharmacy@example.com`,
				createdAt: now,
				updatedAt: now,
			})
		} else {
			await tx
				.update(pharmacies)
				.set({
					ownerId: owner.id,
					name: `Owner ${owner.index} Pharmacy`,
					description: `Seed pharmacy for ${owner.email}.`,
					updatedAt: now,
				})
				.where(eq(pharmacies.id, pharmacyId))
		}

		const categories = [
			{
				id: categoryPainReliefId,
				name: "Pain relief",
				description: "OTC pain and fever medicines",
				requiresPrescription: false,
			},
			{
				id: categoryColdFluId,
				name: "Cold & flu",
				description: "Cough, colds, and flu symptom relief",
				requiresPrescription: false,
			},
			{
				id: categorySkinCareId,
				name: "Skin care",
				description: "Creams, ointments, and dermatology items",
				requiresPrescription: false,
			},
			{
				id: categoryPrescriptionMedsId,
				name: "Prescription meds",
				description: "Medicines that require a prescription",
				requiresPrescription: true,
			},
		] as const

		const categoryById = new Map(categories.map(c => [c.id, c]))

		for (const c of categories) {
			const existingCategory = await tx.select().from(productCategories).where(eq(productCategories.id, c.id)).limit(1)
			if (existingCategory.length > 0) continue
			await tx.insert(productCategories).values({
				id: c.id,
				ownerId: owner.id,
				name: c.name,
				description: c.description,
				parentCategoryId: null,
				requiresPrescription: c.requiresPrescription,
				createdAt: now,
				updatedAt: now,
			})
		}

		const brandNames = ["MediCare Pharma", "WellPlus", "HealFast", "CuraGen", "SunLeaf"] as const
		const brandIds: string[] = []
		for (const brandName of brandNames) {
			const brandId = await ensureBrandId(tx, brandName, now)
			brandIds.push(brandId)
			await ensureOwnerBrandLink(tx, owner.id, brandId, now)
		}

		const staffIds: string[] = []
		for (const staffUserId of staffUserIds) {
			const staffId = stableId("staff_profile", staffUserId)
			staffIds.push(staffId)

			const existingStaff = await tx.select().from(staff).where(eq(staff.id, staffId)).limit(1)
			if (existingStaff.length === 0) {
				await tx.insert(staff).values({
					id: staffId,
					userId: staffUserId,
					ownerId: owner.id,
					department: pick(["Dispensing", "Inventory", "Customer service"] as const, owner.index),
					position: pick(["Pharmacy assistant", "Pharmacy technician"] as const, staffIds.length),
					specialization: null,
					bio: null,
					phone: null,
					isActive: true,
					createdAt: now,
					updatedAt: now,
				})
			} else {
				await tx
					.update(staff)
					.set({
						ownerId: owner.id,
						isActive: true,
						updatedAt: now,
					})
					.where(eq(staff.id, staffId))
			}

			const pharmacyStaffId = stableId("pharmacy_staff", `${pharmacyId}:${staffId}`)
			const existingAssign = await tx.select().from(pharmacyStaff).where(eq(pharmacyStaff.id, pharmacyStaffId)).limit(1)
			if (existingAssign.length === 0) {
				await tx.insert(pharmacyStaff).values({
					id: pharmacyStaffId,
					pharmacyId,
					staffId,
					assignedAt: now,
				})
			}
		}

		const generics = [
			"Paracetamol",
			"Ibuprofen",
			"Amoxicillin",
			"Loratadine",
			"Cetirizine",
			"Omeprazole",
			"Salbutamol",
			"Metformin",
			"Amlodipine",
			"Atorvastatin",
			"Dextromethorphan",
			"Guaifenesin",
			"Hydrocortisone",
			"Mupirocin",
			"Betadine (Povidone-iodine)",
			"Oral rehydration salts",
			"Zinc",
			"Vitamin C",
			"Calcium carbonate",
			"Simethicone",
		] as const

		const dosageForms = ["tablet", "capsule", "syrup", "cream", "drops"] as const
		const strengths = ["10mg", "20mg", "250mg", "500mg", "5mg/5mL", "100mg/5mL", "1%", "2%"] as const
		const units = ["tablet", "capsule", "ml", "gram", "piece"] as const
		const suppliers = ["Seed Supplier A", "Seed Supplier B", "Seed Supplier C"] as const

		const rxGenerics = new Set<string>(["Amoxicillin", "Metformin", "Amlodipine"])

		for (let i = 0; i < 20; i++) {
			const productId = stableId("product", `${pharmacyId}:${i}`)
			const existingProduct = await tx.select().from(medicalProducts).where(eq(medicalProducts.id, productId)).limit(1)

			const genericName = pick(generics, i)
			const dosageForm = pick(dosageForms, i + owner.index)
			const strength = pick(strengths, i + owner.index * 2)
			const unit = pick(units, i + 1)

			const brandIdx = (i + owner.index) % brandIds.length
			const brandId = brandIds[brandIdx]!
			const brandName = brandNames[brandIdx]!

			const categoryId = rxGenerics.has(genericName)
				? categoryPrescriptionMedsId
				: pick([categoryPainReliefId, categoryColdFluId, categorySkinCareId] as const, i)

			const requiresPrescription = categoryById.get(categoryId)?.requiresPrescription ?? false
			const lowStockThreshold = 5 + ((i + owner.index) % 6) * 5

			const productName = `${genericName} ${strength} (${dosageForm})`
			const manufacturer = `${brandName} Labs`

			if (existingProduct.length === 0) {
				await tx.insert(medicalProducts).values({
					id: productId,
					pharmacyId,
					name: productName,
					genericName,
					brandName,
					brandId,
					description: `Seed product ${i + 1} for ${owner.email}.`,
					manufacturer,
					categoryId,
					dosageForm,
					strength,
					unit,
					requiresPrescription,
					imageUrl: null,
					supplier: pick(suppliers, i),
					lowStockThreshold,
					createdAt: now,
					updatedAt: now,
				})
			} else {
				await tx
					.update(medicalProducts)
					.set({
						pharmacyId,
						name: productName,
						genericName,
						brandName,
						brandId,
						manufacturer,
						categoryId,
						dosageForm,
						strength,
						unit,
						requiresPrescription,
						supplier: pick(suppliers, i),
						lowStockThreshold,
						updatedAt: now,
					})
					.where(eq(medicalProducts.id, productId))
			}

			for (let v = 0; v < 2; v++) {
				const variantId = stableId("variant", `${productId}:${v}`)
				const existingVariant = await tx
					.select()
					.from(medicalProductVariants)
					.where(eq(medicalProductVariants.id, variantId))
					.limit(1)

				const label =
					v === 0
						? pick(["Small pack", "10s blister", "60mL bottle", "15g tube"] as const, i)
						: pick(["Large pack", "30s blister", "120mL bottle", "30g tube"] as const, i + 1)

				if (existingVariant.length === 0) {
					await tx.insert(medicalProductVariants).values({
						id: variantId,
						productId,
						label,
						sortOrder: v,
						createdAt: now,
						updatedAt: now,
					})
				} else {
					await tx
						.update(medicalProductVariants)
						.set({ label, sortOrder: v, updatedAt: now })
						.where(eq(medicalProductVariants.id, variantId))
				}

				const inventoryId = stableId("inventory", variantId)
				const existingInv = await tx
					.select()
					.from(pharmacyInventory)
					.where(eq(pharmacyInventory.id, inventoryId))
					.limit(1)

				const quantity = 5 + ((i + v + owner.index) % 50)
				const priceNum = 25 + i * 3 + v * 10 + owner.index * 5
				const price = `${priceNum.toFixed(2)}`

				const hasDiscount = (i + v) % 3 === 0
				const discountPrice = hasDiscount ? `${Math.max(priceNum - 5 - v * 2, 1).toFixed(2)}` : null

				const hasExpiry = (i + v) % 2 === 0
				const expiryDate = hasExpiry ? new Date(now.getTime() + (30 + i * 7) * 24 * 60 * 60 * 1000) : null

				const batchNumber = `SEED-${owner.index}-${i.toString().padStart(2, "0")}-${v}`
				const isAvailable = quantity > 0

				if (existingInv.length === 0) {
					await tx.insert(pharmacyInventory).values({
						id: inventoryId,
						pharmacyId,
						productId,
						variantId,
						quantity,
						price,
						discountPrice,
						expiryDate,
						batchNumber,
						isAvailable,
						lastRestocked: now,
						createdAt: now,
						updatedAt: now,
					})
				} else {
					await tx
						.update(pharmacyInventory)
						.set({
							quantity,
							price,
							discountPrice,
							expiryDate,
							batchNumber,
							isAvailable,
							lastRestocked: now,
							updatedAt: now,
						})
						.where(eq(pharmacyInventory.id, inventoryId))
				}
			}
		}
	})

	console.log(`Seeded owner catalog: ${owner.email}`)
	console.log(`  Pharmacy: ${pharmacyId}`)
	console.log("  Products: 20 (each with 2 variants + inventory rows)")
	console.log("  Staff: 2 (assigned to pharmacy)")
	console.log("")
}

function buildSeedUsers(): {
	allUsers: SeedUser[]
	owners: SeedUser[]
	staffByOwnerEmail: Record<string, SeedUser[]>
} {
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

	const staffByOwnerEmail: Record<string, SeedUser[]> = {}
	for (const owner of owners) {
		const ownerKey = owner.email
		const staffUsers: SeedUser[] = Array.from({ length: 2 }, (_, idx) => {
			const n = idx + 1
			return {
				email: `${owner.email.replace("@example.com", "")}.staff${n}@example.com`,
				password,
				firstName: "Staff",
				lastName: `${owner.lastName}${n}`,
				middleName: `S${owner.middleName}${n}`,
				role: "staff",
			}
		})
		staffByOwnerEmail[ownerKey] = staffUsers
	}

	const allUsers = [admin, ...owners, ...Object.values(staffByOwnerEmail).flat(), ...customers]
	return { allUsers, owners, staffByOwnerEmail }
}

async function seed() {
	const auth = getAuth()
	const db = createDBClient()

	const { allUsers, owners, staffByOwnerEmail } = buildSeedUsers()

	const userIdByEmail = new Map<string, string>()
	for (const u of allUsers) {
		const userId = await seedUser(auth, db, u)
		userIdByEmail.set(u.email, userId)
	}

	for (let idx = 0; idx < owners.length; idx++) {
		const ownerSeed = owners[idx]!
		const ownerId = userIdByEmail.get(ownerSeed.email)
		if (!ownerId) throw new Error(`Owner not created: ${ownerSeed.email}`)

		const staffSeeds = staffByOwnerEmail[ownerSeed.email] ?? []
		const staffUserIds = staffSeeds.map(s => userIdByEmail.get(s.email)).filter((v): v is string => Boolean(v))

		try {
			await seedOwnerCatalog({
				db,
				owner: { id: ownerId, email: ownerSeed.email, index: idx + 1 },
				staffUserIds,
			})
		} catch (err) {
			console.error(
				`Owner catalog seed failed for ${ownerSeed.email} (did you run DB migrations?).`,
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
