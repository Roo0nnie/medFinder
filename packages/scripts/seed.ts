/**
 * Seed script: creates deterministic owners/pharmacies plus brands, categories,
 * 1000 medical products (with variants + inventory), and staff assignments.
 *
 * Run from repo root: pnpm db:seed
 * Requires: DATABASE_URL (packages/db/.env), BETTER_AUTH_SECRET + BETTER_AUTH_TRUSTED_ORIGINS (apps/web/.env)
 */
import "./load-env"

import { and, eq, inArray, notInArray } from "drizzle-orm"

import { getAuth } from "@repo/auth"
import { createDBClient } from "@repo/db/client"
import {
	brands,
	medicalProducts,
	medicalProductVariants,
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

const OWNER_COUNT = 20
const STAFF_PER_OWNER = 5
const CUSTOMERS_PER_OWNER = 5
const PRODUCT_COUNT = 1000

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

function pad3(n: number) {
	return String(n).padStart(3, "0")
}

function pad4(n: number) {
	return String(n).padStart(4, "0")
}

function pickDeterministic<T>(items: T[], seed: number) {
	if (items.length === 0) throw new Error("pickDeterministic: empty items")
	const idx = Math.abs(seed) % items.length
	return items[idx]!
}

function geoForCustomerEmail(email: string): {
	latitude: number
	longitude: number
	locationAccuracy: number
	locationUpdatedAt: Date
	locationConsentAt: Date
} | null {
	// Expected: customer_owner{ownerN}_{customerN}@example.com
	const m = /^customer_owner(\d+)_(\d+)@example\.com$/i.exec(email)
	if (!m) return null
	const ownerN = Number.parseInt(m[1]!, 10)
	const customerN = Number.parseInt(m[2]!, 10)
	if (!Number.isFinite(ownerN) || !Number.isFinite(customerN) || ownerN < 1) return null

	// Mirror the pharmacy seed locations (NCR), then offset slightly per customer.
	// This keeps customers clustered near their owner's pharmacy for "nearby" queries.
	const cityDefs = [
		{ lat: 14.5995, lon: 120.9842 }, // Manila
		{ lat: 14.676, lon: 121.0437 }, // Quezon City
		{ lat: 14.5547, lon: 121.0244 }, // Makati
		{ lat: 14.5764, lon: 121.0851 }, // Pasig
		{ lat: 14.5176, lon: 121.0509 }, // Taguig
	] as const

	const cd = cityDefs[(ownerN - 1) % cityDefs.length]!
	const baseLat = cd.lat + ownerN * 0.001
	const baseLon = cd.lon + ownerN * 0.001

	// ~0.0003 deg ≈ 33m latitude; keep within a few hundred meters.
	const jitter = 0.0003 * customerN
	const now = new Date()

	return {
		latitude: baseLat + jitter,
		longitude: baseLon - jitter,
		locationAccuracy: 35,
		locationUpdatedAt: now,
		locationConsentAt: now,
	}
}

async function seedUser(auth: ReturnType<typeof getAuth>, db: ReturnType<typeof createDBClient>, u: SeedUser) {
	const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, u.email)).limit(1)
	const customerGeo = u.role === "customer" ? geoForCustomerEmail(u.email) : null
	if (existing.length > 0) {
		await db
			.update(users)
			.set({
				first_name: u.firstName,
				last_name: u.lastName,
				middle_name: u.middleName,
				role: u.role,
				...(customerGeo
					? {
							latitude: customerGeo.latitude,
							longitude: customerGeo.longitude,
							locationAccuracy: customerGeo.locationAccuracy,
							locationUpdatedAt: customerGeo.locationUpdatedAt,
							locationConsentAt: customerGeo.locationConsentAt,
						}
					: {}),
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
				...(customerGeo
					? {
							latitude: customerGeo.latitude,
							longitude: customerGeo.longitude,
							locationAccuracy: customerGeo.locationAccuracy,
							locationUpdatedAt: customerGeo.locationUpdatedAt,
							locationConsentAt: customerGeo.locationConsentAt,
						}
					: {}),
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

	const owners: SeedUser[] = Array.from({ length: OWNER_COUNT }, (_, idx) => {
		const n = idx + 1
		return {
			email: `owner${n}@example.com`,
			password,
			firstName: "Owner",
			lastName: `User${n}`,
			middleName: `O${n}`,
			role: "owner",
		}
	})

	const staffUsers: SeedUser[] = owners.flatMap((_, ownerIdx) => {
		const ownerN = ownerIdx + 1
		return Array.from({ length: STAFF_PER_OWNER }, (_, staffIdx) => {
			const s = staffIdx + 1
			return {
				email: `staff_owner${ownerN}_${s}@example.com`,
				password,
				firstName: "Staff",
				lastName: `Owner${ownerN}_${s}`,
				middleName: `S${ownerN}_${s}`,
				role: "staff",
			}
		})
	})

	const customers: SeedUser[] = owners.flatMap((_, ownerIdx) => {
		const ownerN = ownerIdx + 1
		return Array.from({ length: CUSTOMERS_PER_OWNER }, (_, custIdx) => {
			const c = custIdx + 1
			return {
				email: `customer_owner${ownerN}_${c}@example.com`,
				password,
				firstName: "Customer",
				lastName: `Owner${ownerN}_${c}`,
				middleName: `C${ownerN}_${c}`,
				role: "customer",
			}
		})
	})

	return [admin, ...owners, ...staffUsers, ...customers]
}

async function seedPharmacies(db: ReturnType<typeof createDBClient>, ownerIds: Record<string, string>) {
	const now = new Date()
	const cityDefs = [
		{ city: "Manila", state: "NCR", zipBase: "10", lat: 14.5995, lon: 120.9842 },
		{ city: "Quezon City", state: "NCR", zipBase: "11", lat: 14.676, lon: 121.0437 },
		{ city: "Makati", state: "NCR", zipBase: "12", lat: 14.5547, lon: 121.0244 },
		{ city: "Pasig", state: "NCR", zipBase: "16", lat: 14.5764, lon: 121.0851 },
		{ city: "Taguig", state: "NCR", zipBase: "16", lat: 14.5176, lon: 121.0509 },
	]

	const rows = Array.from({ length: OWNER_COUNT }, (_, idx) => {
		const ownerN = idx + 1
		const ownerEmail = `owner${ownerN}@example.com`
		const ownerId = ownerIds[ownerEmail]
		if (!ownerId) throw new Error(`Expected ${ownerEmail} in seed users`)

		const cd = cityDefs[idx % cityDefs.length]!
		const id = `seed-pharmacy-${String(ownerN).padStart(2, "0")}`

		return {
			id,
			ownerId,
			name: `Seed Pharmacy ${ownerN}`,
			description: `Seed pharmacy (owner${ownerN})`,
			address: `${100 + ownerN} Rizal Ave`,
			city: cd.city,
			municipality: null as string | null,
			state: cd.state,
			zipCode: `${cd.zipBase}${String(ownerN).padStart(2, "0")}`,
			country: "PH",
			certificateStatus: "approved" as const,
			isActive: true,
			latitude: cd.lat + ownerN * 0.001,
			longitude: cd.lon + ownerN * 0.001,
		}
	})

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
	console.log(`Seeded pharmacies (${rows.length}).`)
}

async function seedBrands(db: ReturnType<typeof createDBClient>, ownerIds: Record<string, string>) {
	const now = new Date()
	const ownerEmails = Array.from({ length: OWNER_COUNT }, (_, idx) => `owner${idx + 1}@example.com`)
	const ownerUserIds = ownerEmails.map(e => {
		const id = ownerIds[e]
		if (!id) throw new Error(`Expected ${e} in seed users`)
		return id
	})

	const baseBrandNames = [
		"Biogesic",
		"Tempra",
		"Calpol",
		"RiteMed",
		"Neozep",
		"Solmux",
		"Enervon",
		"Diatabs",
		"Alaxan",
		"Ceelin",
		"Bioflu",
		"Bactidol",
		"Advil",
		"Tylenol",
		"Motrin",
		"Benadryl",
		"Claritin",
		"Zyrtec",
		"Robitussin",
		"Mucinex",
		"NyQuil",
		"DayQuil",
		"Pepto-Bismol",
		"Imodium",
		"Tums",
		"Gaviscon",
		"Nexium",
		"Voltaren",
		"Aleve",
		"Panadol",
	]

	const brandNames = Array.from({ length: 60 }, (_, idx) => {
		const base = baseBrandNames[idx % baseBrandNames.length]!
		const suffix = idx < baseBrandNames.length ? "" : ` ${Math.floor(idx / baseBrandNames.length) + 1}`
		return `${base}${suffix}`.trim()
	})

	const brandDefs = brandNames.map((name, idx) => ({
		id: `seed-brand-${pad3(idx + 1)}`,
		name,
	}))

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
			.onConflictDoNothing({
				target: brands.normalizedName,
			})

		const existing = await db.select({ id: brands.id }).from(brands).where(eq(brands.normalizedName, nn)).limit(1)
		const id = existing[0]?.id
		if (!id) throw new Error(`Failed to resolve brand id for normalizedName=${nn}`)

		nameToId[b.name] = id
	}

	const links: { id: string; ownerId: string; brandId: string }[] = []
	const brandIds = brandDefs.map(b => nameToId[b.name]!)
	for (let ownerIdx = 0; ownerIdx < ownerUserIds.length; ownerIdx++) {
		const ownerId = ownerUserIds[ownerIdx]!
		for (let j = 0; j < 20; j++) {
			const brandId = brandIds[(ownerIdx * 7 + j) % brandIds.length]!
			links.push({
				id: `seed-ob-${String(ownerIdx + 1).padStart(2, "0")}-${pad3(j + 1)}`,
				ownerId,
				brandId,
			})
		}
	}

	for (const l of links) {
		await db
			.insert(ownerBrands)
			.values({
				...l,
				createdAt: now,
				updatedAt: now,
			})
			.onConflictDoNothing({
				target: [ownerBrands.ownerId, ownerBrands.brandId],
			})
	}

	console.log("Seeded brands and owner_brands.")
	return nameToId
}

type SeedCategoriesByOwner = Record<string, { id: string; name: string; requiresPrescription: boolean }[]>

async function seedProductCategories(
	db: ReturnType<typeof createDBClient>,
	ownerIds: Record<string, string>
): Promise<SeedCategoriesByOwner> {
	const now = new Date()
	const categoryTemplates: { key: string; name: string; requiresPrescription: boolean }[] = [
		{ key: "pain", name: "Pain Relief", requiresPrescription: false },
		{ key: "cold", name: "Cold & Flu", requiresPrescription: false },
		{ key: "allergy", name: "Allergy", requiresPrescription: false },
		{ key: "digestive", name: "Digestive Care", requiresPrescription: false },
		{ key: "vitamins", name: "Vitamins & Supplements", requiresPrescription: false },
		{ key: "derm", name: "Skin Care", requiresPrescription: false },
		{ key: "diabetes", name: "Diabetes Care", requiresPrescription: true },
		{ key: "firstaid", name: "First Aid", requiresPrescription: false },
		{ key: "cardio", name: "Heart Health", requiresPrescription: true },
		{ key: "rx", name: "Prescription", requiresPrescription: true },
	]

	const byOwner: SeedCategoriesByOwner = {}
	const rows: { id: string; ownerId: string; name: string; requiresPrescription: boolean }[] = []

	for (let idx = 0; idx < OWNER_COUNT; idx++) {
		const ownerN = idx + 1
		const ownerEmail = `owner${ownerN}@example.com`
		const ownerId = ownerIds[ownerEmail]
		if (!ownerId) throw new Error(`Expected ${ownerEmail} in seed users`)

		byOwner[ownerId] = categoryTemplates.map(t => ({
			id: `seed-category-${String(ownerN).padStart(2, "0")}-${t.key}`,
			name: t.name,
			requiresPrescription: t.requiresPrescription,
		}))

		for (const t of categoryTemplates) {
			rows.push({
				id: `seed-category-${String(ownerN).padStart(2, "0")}-${t.key}`,
				ownerId,
				name: t.name,
				requiresPrescription: t.requiresPrescription,
			})
		}
	}

	for (const r of rows) {
		await db
			.insert(productCategories)
			.values({
				id: r.id,
				ownerId: r.ownerId,
				name: r.name,
				description: "",
				requiresPrescription: r.requiresPrescription,
				createdAt: now,
				updatedAt: now,
			})
			.onConflictDoUpdate({
				target: productCategories.id,
				set: {
					ownerId: r.ownerId,
					name: r.name,
					requiresPrescription: r.requiresPrescription,
					updatedAt: now,
				},
			})
	}

	console.log(`Seeded product categories (${rows.length}).`)
	return byOwner
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
	description?: string
	indications?: string
	activeIngredients?: string
	searchSynonyms?: string
	manufacturer?: string
}

type ProductVariantSeedRow = {
	id: string
	productId: string
	pharmacyId: string
	inventoryId: string
	label: string
	unit: string
	sortOrder: number
	strength: string
	dosageForm: string
	price: string
	quantity: number
}

/** Single demo image URL applied to every seeded product variant (gallery uses two identical slides). */
const SEED_DEFAULT_PRODUCT_IMAGE =
	"https://exxifujdzeimjusoycos.supabase.co/storage/v1/object/public/sample/sample.svg"

const SEED_DEFAULT_VARIANT_GALLERY: string[] = [SEED_DEFAULT_PRODUCT_IMAGE, SEED_DEFAULT_PRODUCT_IMAGE]

function medicalSearchTextForProduct(d: ProductSeedRow) {
	const name = d.name.toLowerCase()
	const generic = d.genericName.toLowerCase()

	if (name.includes("bioflu") || name.includes("neozep")) {
		return {
			description:
				"Combination cold and flu medicine for temporary relief of fever, headache, colds, and body aches.",
			indications: "flu, colds, fever, headache, runny nose, body aches",
			activeIngredients: d.genericName,
			searchSynonyms: "flu medicine, cold remedy, trangkaso, sipon, fever reducer",
		}
	}

	if (name.includes("solmux")) {
		return {
			description:
				"Mucolytic medicine that helps loosen thick phlegm and ease productive cough from respiratory irritation.",
			indications: "cough with phlegm, chest congestion, productive cough",
			activeIngredients: d.genericName,
			searchSynonyms: "phlegm remover, expectorant, ubo with plema",
		}
	}

	if (name.includes("paracetamol") || generic.includes("paracetamol")) {
		return {
			description:
				"Analgesic and antipyretic used for temporary relief of mild to moderate pain and reduction of fever.",
			indications: "fever, headache, toothache, body pain, mild pain",
			activeIngredients: d.genericName,
			searchSynonyms: "acetaminophen, fever reducer, pain reliever",
		}
	}

	if (name.includes("ibuprofen") || generic.includes("ibuprofen")) {
		return {
			description:
				"Nonsteroidal anti-inflammatory medicine for relief of pain, swelling, and fever in common conditions.",
			indications: "headache, muscle pain, dysmenorrhea, inflammation, fever",
			activeIngredients: d.genericName,
			searchSynonyms: "nsaid, anti-inflammatory, pain reliever",
		}
	}

	if (name.includes("loperamide") || name.includes("diatabs ors")) {
		return {
			description:
				"Digestive support medicine used for acute diarrhea symptom control and oral rehydration support.",
			indications: "diarrhea, loose bowel movement, dehydration support",
			activeIngredients: d.genericName,
			searchSynonyms: "anti-diarrheal, lbm relief, oral rehydration salts",
		}
	}

	if (name.includes("omeprazole")) {
		return {
			description:
				"Proton pump inhibitor used to reduce stomach acid for relief of hyperacidity and reflux symptoms.",
			indications: "acid reflux, hyperacidity, heartburn, dyspepsia",
			activeIngredients: d.genericName,
			searchSynonyms: "acid reducer, ppi, gerd relief",
		}
	}

	if (name.includes("enervon") || name.includes("ceelin")) {
		return {
			description:
				"Vitamin supplement formulated to help support immunity, energy metabolism, and overall wellness.",
			indications: "vitamin deficiency support, immune support, daily supplementation",
			activeIngredients: d.genericName,
			searchSynonyms: "vitamins, immune booster, supplement",
		}
	}

	if (name.includes("bactidol")) {
		return {
			description:
				"Oral antiseptic solution for temporary relief of sore throat discomfort and mouth or throat irritation.",
			indications: "sore throat, mouth irritation, throat discomfort",
			activeIngredients: d.genericName,
			searchSynonyms: "throat gargle, oral antiseptic, sore throat relief",
		}
	}

	if (name.includes("isopropyl alcohol")) {
		return {
			description:
				"Topical antiseptic for skin disinfection and hand hygiene to help reduce common germs on contact.",
			indications: "skin disinfection, hand hygiene, first aid cleansing",
			activeIngredients: d.genericName,
			searchSynonyms: "rubbing alcohol, antiseptic, disinfectant",
		}
	}

	return {
		description: d.description ?? `${d.brandName} ${d.genericName} formulation for routine symptom relief.`,
		indications: d.indications ?? "general symptom relief",
		activeIngredients: d.activeIngredients ?? d.genericName,
		searchSynonyms: d.searchSynonyms ?? `${d.genericName}, ${d.brandName}`,
	}
}

async function seedProducts(
	db: ReturnType<typeof createDBClient>,
	ctx: {
		pharmacies: { id: string; ownerId: string }[]
		brandMap: Record<string, string>
		categoriesByOwner: SeedCategoriesByOwner
	}
) {
	const now = new Date()

	const b = (name: string) => {
		const id = ctx.brandMap[name]
		if (!id) throw new Error(`Missing brand in brandMap: ${name}`)
		return id
	}

	const dosageForms = ["Tablet", "Capsule", "Syrup", "Suspension", "Solution", "Powder", "Cream", "Ointment"] as const
	const units = ["box", "strip", "bottle", "sachet", "tube", "jar", "tin", "piece"] as const
	const strengths = ["50mg", "100mg", "200mg", "250mg", "500mg", "10mg", "20mg", "70%", "0.1%", "250mg/5ml"] as const

	const brandNames = Object.keys(ctx.brandMap)
	if (brandNames.length === 0) throw new Error("brandMap is empty")

	const generics = [
		"Paracetamol",
		"Ibuprofen",
		"Cetirizine",
		"Loratadine",
		"Carbocisteine",
		"Dextromethorphan",
		"Guaifenesin",
		"Omeprazole",
		"Loperamide",
		"Oral Rehydration Salts",
		"Metformin",
		"Amlodipine",
		"Atorvastatin",
		"Amoxicillin",
		"Azithromycin",
		"Hexetidine",
		"Isopropyl Alcohol",
		"Hydrocortisone",
		"Mupirocin",
	] as const

	const defs: ProductSeedRow[] = []

	for (let i = 0; i < PRODUCT_COUNT; i++) {
		const pharmacy = ctx.pharmacies[i % ctx.pharmacies.length]!
		const ownerCats = ctx.categoriesByOwner[pharmacy.ownerId]
		if (!ownerCats || ownerCats.length === 0) throw new Error(`Missing categories for ownerId=${pharmacy.ownerId}`)

		const cat = ownerCats[i % ownerCats.length]!
		const genericName = pickDeterministic([...generics], i * 17 + pharmacy.id.length)
		const brandName = pickDeterministic(brandNames, i * 31 + pharmacy.id.length)
		const dosageForm = pickDeterministic([...dosageForms], i * 13)
		const strength = pickDeterministic([...strengths], i * 19)
		const unit = pickDeterministic([...units], i * 23)

		const productNo = i + 1
		const productId = `seed-product-${pad4(productNo)}`
		const variantId = `seed-variant-${pad4(productNo)}-01`
		const inventoryId = `seed-inv-${pad4(productNo)}-01`

		const name = `${brandName} ${genericName}`
		const variantLabel =
			unit === "box"
				? "Box"
				: unit === "strip"
					? "Strip"
					: unit === "bottle"
						? "Bottle"
						: unit === "sachet"
							? "Sachet"
							: unit === "tube"
								? "Tube"
								: unit === "jar"
									? "Jar"
									: unit === "tin"
										? "Tin"
										: "Piece"

		const price = (25 + (i % 250) * 0.75).toFixed(2)
		const quantity = 5 + (i % 120)

		defs.push({
			productId,
			variantId,
			inventoryId,
			pharmacyId: pharmacy.id,
			categoryId: cat.id,
			name,
			genericName,
			brandName,
			brandKey: brandName,
			strength,
			dosageForm,
			variantLabel,
			unit,
			price,
			quantity,
			// allow medicalSearchTextForProduct() to enrich the important FTS fields
		})
	}

	const extrasByProduct: Record<string, ProductVariantSeedRow[]> = {}

	// Keep seeded variant cardinality deterministic across reruns:
	// remove stale variants on seeded products that are not part of the current seed spec.
	const seedProductIds = defs.map(d => d.productId)
	const allowedVariantIds = [
		...defs.map(d => d.variantId),
	]
	await db
		.delete(medicalProductVariants)
		.where(
			and(
				inArray(medicalProductVariants.productId, seedProductIds),
				notInArray(medicalProductVariants.id, allowedVariantIds)
			)
		)

	for (const d of defs) {
		const categoryId = d.categoryId
		const brandIdVal = b(d.brandKey)
		const medicalText = medicalSearchTextForProduct(d)
		const description = d.description ?? medicalText.description
		const indications = d.indications ?? medicalText.indications
		const activeIngredients = d.activeIngredients ?? medicalText.activeIngredients
		const searchSynonyms = d.searchSynonyms ?? medicalText.searchSynonyms
		const manufacturer = d.manufacturer ?? d.brandName

		await db
			.insert(medicalProducts)
			.values({
				id: d.productId,
				pharmacyId: d.pharmacyId,
				name: d.name,
				genericName: d.genericName,
				brandName: d.brandName,
				brandId: brandIdVal,
				description,
				indications,
				activeIngredients,
				searchSynonyms,
				manufacturer,
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
					description,
					indications,
					activeIngredients,
					searchSynonyms,
					manufacturer,
					categoryId,
					updatedAt: now,
				},
			})

		const primaryImageUrl = SEED_DEFAULT_VARIANT_GALLERY[0] ?? ""

		const variantRows: ProductVariantSeedRow[] = [
			{
				id: d.variantId,
				productId: d.productId,
				pharmacyId: d.pharmacyId,
				inventoryId: d.inventoryId,
				label: d.variantLabel,
				unit: d.unit,
				sortOrder: 0,
				strength: d.strength,
				dosageForm: d.dosageForm,
				price: d.price,
				quantity: d.quantity,
			},
			...(extrasByProduct[d.productId] ?? []),
		]

		for (const row of variantRows) {
			await db
				.insert(medicalProductVariants)
				.values({
					id: row.id,
					productId: row.productId,
					label: row.label,
					unit: row.unit,
					sortOrder: row.sortOrder,
					strength: row.strength,
					dosageForm: row.dosageForm,
					imageUrl: primaryImageUrl,
					imageUrls: SEED_DEFAULT_VARIANT_GALLERY,
					createdAt: now,
					updatedAt: now,
				})
				.onConflictDoUpdate({
					target: medicalProductVariants.id,
					set: {
						label: row.label,
						unit: row.unit,
						sortOrder: row.sortOrder,
						strength: row.strength,
						dosageForm: row.dosageForm,
						imageUrl: primaryImageUrl,
						imageUrls: SEED_DEFAULT_VARIANT_GALLERY,
						updatedAt: now,
					},
				})

			await db
				.insert(pharmacyInventory)
				.values({
					id: row.inventoryId,
					pharmacyId: row.pharmacyId,
					productId: row.productId,
					variantId: row.id,
					quantity: row.quantity,
					price: row.price,
					isAvailable: true,
					createdAt: now,
					updatedAt: now,
				})
				.onConflictDoUpdate({
					target: pharmacyInventory.id,
					set: {
						variantId: row.id,
						quantity: row.quantity,
						price: row.price,
						isAvailable: true,
						updatedAt: now,
					},
				})
		}
	}

	console.log(
		`Seeded medical products (${defs.length}), variants (${allowedVariantIds.length}), and inventory rows (${allowedVariantIds.length}).`
	)
}

async function seedStaffAndAssignments(
	db: ReturnType<typeof createDBClient>,
	ownerIds: Record<string, string>,
	staffUserIds: Record<string, string>
) {
	const now = new Date()

	for (let ownerIdx = 0; ownerIdx < OWNER_COUNT; ownerIdx++) {
		const ownerN = ownerIdx + 1
		const ownerEmail = `owner${ownerN}@example.com`
		const ownerId = ownerIds[ownerEmail]
		if (!ownerId) throw new Error(`Expected ${ownerEmail} in seed users`)

		const pharmacyId = `seed-pharmacy-${String(ownerN).padStart(2, "0")}`

		for (let staffIdx = 0; staffIdx < STAFF_PER_OWNER; staffIdx++) {
			const staffN = staffIdx + 1
			const staffEmail = `staff_owner${ownerN}_${staffN}@example.com`
			const userId = staffUserIds[staffEmail]
			if (!userId) throw new Error(`Expected staff user ${staffEmail} in seed users`)

			const staffId = `seed-staff-${String(ownerN).padStart(2, "0")}-${String(staffN).padStart(2, "0")}`
			const linkId = `seed-phstaff-${String(ownerN).padStart(2, "0")}-${String(staffN).padStart(2, "0")}`

			await db
				.insert(staff)
				.values({
					id: staffId,
					userId,
					ownerId,
					department: "Pharmacy",
					position: "Assistant",
					specialization: "General",
					isActive: true,
					createdAt: now,
					updatedAt: now,
				})
				.onConflictDoUpdate({
					target: staff.id,
					set: {
						userId,
						ownerId,
						department: "Pharmacy",
						position: "Assistant",
						specialization: "General",
						isActive: true,
						updatedAt: now,
					},
				})

			await db
				.insert(pharmacyStaff)
				.values({
					id: linkId,
					pharmacyId,
					staffId,
					assignedAt: now,
				})
				.onConflictDoUpdate({
					target: pharmacyStaff.id,
					set: {
						pharmacyId,
						staffId,
					},
				})
		}
	}

	console.log(`Seeded staff profiles (${OWNER_COUNT * STAFF_PER_OWNER}) and pharmacy assignments.`)
}

async function seed() {
	const auth = getAuth()
	const db = createDBClient()

	const allUsers = buildSeedUsers()
	const ownerIds: Record<string, string> = {}
	const staffUserIds: Record<string, string> = {}

	for (const u of allUsers) {
		const id = await seedUser(auth, db, u)
		if (u.role === "owner") ownerIds[u.email] = id
		if (u.role === "staff") staffUserIds[u.email] = id
	}

	await seedPharmacies(db, ownerIds)
	const brandMap = await seedBrands(db, ownerIds)
	const categoriesByOwner = await seedProductCategories(db, ownerIds)
	await seedStaffAndAssignments(db, ownerIds, staffUserIds)

	await seedProducts(db, {
		pharmacies: Array.from({ length: OWNER_COUNT }, (_, idx) => {
			const ownerN = idx + 1
			const ownerEmail = `owner${ownerN}@example.com`
			const ownerId = ownerIds[ownerEmail]
			if (!ownerId) throw new Error(`Expected ${ownerEmail} in seed users`)
			return {
				id: `seed-pharmacy-${String(ownerN).padStart(2, "0")}`,
				ownerId,
			}
		}),
		brandMap,
		categoriesByOwner,
	})

	console.log("Seed complete.")
	process.exit(0)
}

seed().catch(err => {
	console.error(err)
	process.exit(1)
})
