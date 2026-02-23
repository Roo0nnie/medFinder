import { defineRelations } from "drizzle-orm"
import { index, primaryKey } from "drizzle-orm/pg-core"

import { createTable } from "./utils/table.js"

// ============================================================================
// BETTER AUTH TABLES
// ============================================================================

export const userRoles = ["admin", "owner", "staff", "customer"] as const
export type UserRole = (typeof userRoles)[number]

export const users = createTable("users", t => ({
	id: t.text("id").primaryKey(),
	email: t.text("email").notNull().unique(),
	emailVerified: t.boolean("email_verified").default(false).notNull(),
	image: t.text("image"),
	name: t.text("name"), // Better Auth default; app uses first_name + last_name
	first_name: t.text("first_name"),
	last_name: t.text("last_name").notNull(),
	middle_name: t.text("middle_name"),
	role: t.text("role").notNull().default("customer"),
	createdAt: t.timestamp("created_at").notNull().defaultNow(),
	updatedAt: t.timestamp("updated_at").notNull().defaultNow(),
}))

export const sessions = createTable("sessions", t => ({
	id: t.text("id").primaryKey(),
	token: t.text("token").notNull().unique(),
	userId: t
		.text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	expiresAt: t.timestamp("expires_at").notNull(),
	ipAddress: t.text("ip_address"),
	userAgent: t.text("user_agent"),
	createdAt: t.timestamp("created_at").notNull().defaultNow(),
	updatedAt: t.timestamp("updated_at").notNull().defaultNow(),
}))

export const accounts = createTable(
	"accounts",
	t => ({
		id: t.text("id"),
		accountId: t.text("account_id").notNull(),
		providerId: t.text("provider_id").notNull(),
		userId: t
			.text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		accessToken: t.text("access_token"),
		refreshToken: t.text("refresh_token"),
		idToken: t.text("id_token"),
		accessTokenExpiresAt: t.timestamp("access_token_expires_at"),
		refreshTokenExpiresAt: t.timestamp("refresh_token_expires_at"),
		scope: t.text("scope"),
		password: t.text("password"), // For email/password auth
		createdAt: t.timestamp("created_at").notNull().defaultNow(),
		updatedAt: t.timestamp("updated_at").notNull().defaultNow(),
	}),
	t => [
		// Composite primary key on provider and account
		primaryKey({ columns: [t.providerId, t.accountId] }),
		index("account_user_id_idx").on(t.userId),
	]
)

export const verifications = createTable(
	"verifications",
	t => ({
		id: t.text("id"),
		identifier: t.text("identifier").notNull(),
		value: t.text("value").notNull(),
		expiresAt: t.timestamp("expires_at").notNull(),
		createdAt: t.timestamp("created_at").defaultNow(),
		updatedAt: t.timestamp("updated_at").defaultNow(),
	}),
	t => [
		// Composite primary key on identifier and value
		primaryKey({ columns: [t.identifier, t.value] }),
	]
)

// ============================================================================
// STAFF
// ============================================================================

export const staff = createTable(
	"staff",
	t => ({
		id: t.text("id").primaryKey(),
		userId: t
			.text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		department: t.text("department").notNull(),
		position: t.text("position").notNull(),
		specialization: t.text("specialization"),
		bio: t.text("bio"),
		phone: t.text("phone"),
		isActive: t.boolean("is_active").notNull().default(true),
		createdAt: t.timestamp("created_at").notNull().defaultNow(),
		updatedAt: t.timestamp("updated_at").notNull().defaultNow(),
	}),
	t => [
		// Index for FTS search (on department, position, specialization, bio)
		index("staff_user_id_idx").on(t.userId),
		// Index for active staff lookups
		index("staff_is_active_idx").on(t.isActive),
	]
)

// ============================================================================
// PHARMACIES
// ============================================================================

export const pharmacies = createTable(
	"pharmacies",
	t => ({
		id: t.text("id").primaryKey(),
		ownerId: t
			.text("owner_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		name: t.text("name").notNull(),
		description: t.text("description"),
		address: t.text("address").notNull(),
		city: t.text("city").notNull(),
		state: t.text("state").notNull(),
		zipCode: t.text("zip_code").notNull(),
		country: t.text("country").notNull().default("US"),
		latitude: t.real("latitude"),
		longitude: t.real("longitude"),
		phone: t.text("phone"),
		email: t.text("email"),
		website: t.text("website"),
		operatingHours: t.text("operating_hours"), // JSON string with days and hours
		isActive: t.boolean("is_active").notNull().default(true),
		createdAt: t.timestamp("created_at").notNull().defaultNow(),
		updatedAt: t.timestamp("updated_at").notNull().defaultNow(),
	}),
	t => [
		index("pharmacies_owner_id_idx").on(t.ownerId),
		index("pharmacies_is_active_idx").on(t.isActive),
		index("pharmacies_city_idx").on(t.city),
	]
)

export const pharmacyStaff = createTable(
	"pharmacy_staff",
	t => ({
		id: t.text("id").primaryKey(),
		pharmacyId: t
			.text("pharmacy_id")
			.notNull()
			.references(() => pharmacies.id, { onDelete: "cascade" }),
		staffId: t
			.text("staff_id")
			.notNull()
			.references(() => staff.id, { onDelete: "cascade" }),
		assignedAt: t.timestamp("assigned_at").notNull().defaultNow(),
	}),
	t => [
		index("pharmacy_staff_pharmacy_id_idx").on(t.pharmacyId),
		index("pharmacy_staff_staff_id_idx").on(t.staffId),
	]
)

// ============================================================================
// PRODUCTS
// ============================================================================

export const productCategories = createTable(
	"product_categories",
	t => ({
		id: t.text("id").primaryKey(),
		name: t.text("name").notNull().unique(),
		description: t.text("description"),
		parentCategoryId: t.text("parent_category_id"),
		createdAt: t.timestamp("created_at").notNull().defaultNow(),
		updatedAt: t.timestamp("updated_at").notNull().defaultNow(),
	}),
	t => [index("product_categories_parent_id_idx").on(t.parentCategoryId!)]
)

export const medicalProducts = createTable(
	"medical_products",
	t => ({
		id: t.text("id").primaryKey(),
		name: t.text("name").notNull(),
		genericName: t.text("generic_name"),
		brandName: t.text("brand_name"),
		description: t.text("description"),
		manufacturer: t.text("manufacturer"),
		categoryId: t
			.text("category_id")
			.notNull()
			.references(() => productCategories.id, { onDelete: "restrict" }),
		dosageForm: t.text("dosage_form"), // e.g., tablet, capsule, liquid
		strength: t.text("strength"), // e.g., 500mg
		unit: t.text("unit").notNull(), // e.g., tablet, ml, piece
		requiresPrescription: t.boolean("requires_prescription").notNull().default(false),
		imageUrl: t.text("image_url"),
		createdAt: t.timestamp("created_at").notNull().defaultNow(),
		updatedAt: t.timestamp("updated_at").notNull().defaultNow(),
	}),
	t => [
		index("medical_products_category_id_idx").on(t.categoryId),
		index("medical_products_name_idx").on(t.name),
		index("medical_products_requires_prescription_idx").on(t.requiresPrescription),
	]
)

// ============================================================================
// INVENTORY
// ============================================================================

export const pharmacyInventory = createTable(
	"pharmacy_inventory",
	t => ({
		id: t.text("id").primaryKey(),
		pharmacyId: t
			.text("pharmacy_id")
			.notNull()
			.references(() => pharmacies.id, { onDelete: "cascade" }),
		productId: t
			.text("product_id")
			.notNull()
			.references(() => medicalProducts.id, { onDelete: "restrict" }),
		quantity: t.integer("quantity").notNull().default(0),
		price: t.numeric("price", { precision: 10, scale: 2 }).notNull(),
		discountPrice: t.numeric("discount_price", { precision: 10, scale: 2 }),
		expiryDate: t.timestamp("expiry_date"),
		batchNumber: t.text("batch_number"),
		isAvailable: t.boolean("is_available").notNull().default(true),
		lastRestocked: t.timestamp("last_restocked"),
		createdAt: t.timestamp("created_at").notNull().defaultNow(),
		updatedAt: t.timestamp("updated_at").notNull().defaultNow(),
	}),
	t => [
		index("pharmacy_inventory_pharmacy_id_idx").on(t.pharmacyId),
		index("pharmacy_inventory_product_id_idx").on(t.productId),
		index("pharmacy_inventory_is_available_idx").on(t.isAvailable),
		index("pharmacy_inventory_expiry_date_idx").on(t.expiryDate),
	]
)

// ============================================================================
// CUSTOMER INTERACTIONS
// ============================================================================

export const productSearches = createTable(
	"product_searches",
	t => ({
		id: t.text("id").primaryKey(),
		customerId: t
			.text("customer_id")
			.references(() => users.id, { onDelete: "cascade" }),
		searchQuery: t.text("search_query").notNull(),
		resultsCount: t.integer("results_count").notNull().default(0),
		searchedAt: t.timestamp("searched_at").notNull().defaultNow(),
	}),
	t => [
		index("product_searches_customer_id_idx").on(t.customerId),
		index("product_searches_searched_at_idx").on(t.searchedAt),
	]
)

export const productReservations = createTable(
	"product_reservations",
	t => ({
		id: t.text("id").primaryKey(),
		customerId: t
			.text("customer_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		inventoryId: t
			.text("inventory_id")
			.notNull()
			.references(() => pharmacyInventory.id, { onDelete: "cascade" }),
		quantity: t.integer("quantity").notNull(),
		status: t.text("status").notNull().default("pending"), // pending, confirmed, cancelled, completed
		expiresAt: t.timestamp("expires_at"),
		createdAt: t.timestamp("created_at").notNull().defaultNow(),
		updatedAt: t.timestamp("updated_at").notNull().defaultNow(),
	}),
	t => [
		index("product_reservations_customer_id_idx").on(t.customerId),
		index("product_reservations_inventory_id_idx").on(t.inventoryId),
		index("product_reservations_status_idx").on(t.status),
		index("product_reservations_expires_at_idx").on(t.expiresAt),
	]
)

// ============================================================================
// PHARMACY & PRODUCT REVIEWS
// ============================================================================

export const pharmacyReviews = createTable(
	"pharmacy_reviews",
	t => ({
		id: t.text("id").primaryKey(),
		pharmacyId: t
			.text("pharmacy_id")
			.notNull()
			.references(() => pharmacies.id, { onDelete: "cascade" }),
		userId: t
			.text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		rating: t.integer("rating").notNull(), // 1-5
		comment: t.text("comment"),
		createdAt: t.timestamp("created_at").notNull().defaultNow(),
		updatedAt: t.timestamp("updated_at").notNull().defaultNow(),
	}),
	t => [
		index("pharmacy_reviews_pharmacy_id_idx").on(t.pharmacyId),
		index("pharmacy_reviews_user_id_idx").on(t.userId),
		index("pharmacy_reviews_pharmacy_user_idx").on(t.pharmacyId, t.userId),
	]
)

export const productReviews = createTable(
	"product_reviews",
	t => ({
		id: t.text("id").primaryKey(),
		productId: t
			.text("product_id")
			.notNull()
			.references(() => medicalProducts.id, { onDelete: "cascade" }),
		userId: t
			.text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		rating: t.integer("rating").notNull(), // 1-5
		comment: t.text("comment"),
		createdAt: t.timestamp("created_at").notNull().defaultNow(),
		updatedAt: t.timestamp("updated_at").notNull().defaultNow(),
	}),
	t => [
		index("product_reviews_product_id_idx").on(t.productId),
		index("product_reviews_user_id_idx").on(t.userId),
		index("product_reviews_product_user_idx").on(t.productId, t.userId),
	]
)

// ============================================================================
// RELATIONS
// ============================================================================
export const relations = defineRelations(
	{
		users,
		sessions,
		accounts,
		staff,
		pharmacies,
		pharmacyStaff,
		productCategories,
		medicalProducts,
		pharmacyInventory,
		productSearches,
		productReservations,
		pharmacyReviews,
		productReviews,
	},
	r => ({
		users: {
			sessions: r.many.sessions(),
			accounts: r.many.accounts(),
			staffProfiles: r.many.staff(),
			pharmaciesOwned: r.many.pharmacies(),
			productSearches: r.many.productSearches(),
			productReservations: r.many.productReservations(),
			pharmacyReviews: r.many.pharmacyReviews(),
			productReviews: r.many.productReviews(),
		},
		sessions: {
			user: r.one.users({
				from: r.sessions.userId,
				to: r.users.id,
			}),
		},
		accounts: {
			user: r.one.users({
				from: r.accounts.userId,
				to: r.users.id,
			}),
		},
		staff: {
			user: r.one.users({
				from: r.staff.userId,
				to: r.users.id,
			}),
			pharmacies: r.many.pharmacyStaff(),
		},
		pharmacies: {
			owner: r.one.users({
				from: r.pharmacies.ownerId,
				to: r.users.id,
			}),
			staff: r.many.pharmacyStaff(),
			inventory: r.many.pharmacyInventory(),
			reviews: r.many.pharmacyReviews(),
		},
		pharmacyStaff: {
			pharmacy: r.one.pharmacies({
				from: r.pharmacyStaff.pharmacyId,
				to: r.pharmacies.id,
			}),
			staff: r.one.staff({
				from: r.pharmacyStaff.staffId,
				to: r.staff.id,
			}),
		},
		productCategories: {
			products: r.many.medicalProducts(),
		},
		medicalProducts: {
			category: r.one.productCategories({
				from: r.medicalProducts.categoryId,
				to: r.productCategories.id,
			}),
			inventory: r.many.pharmacyInventory(),
			reviews: r.many.productReviews(),
		},
		pharmacyInventory: {
			pharmacy: r.one.pharmacies({
				from: r.pharmacyInventory.pharmacyId,
				to: r.pharmacies.id,
			}),
			product: r.one.medicalProducts({
				from: r.pharmacyInventory.productId,
				to: r.medicalProducts.id,
			}),
			reservations: r.many.productReservations(),
		},
		productSearches: {
			customer: r.one.users({
				from: r.productSearches.customerId,
				to: r.users.id,
			}),
		},
		productReservations: {
			customer: r.one.users({
				from: r.productReservations.customerId,
				to: r.users.id,
			}),
			inventory: r.one.pharmacyInventory({
				from: r.productReservations.inventoryId,
				to: r.pharmacyInventory.id,
			}),
		},
		pharmacyReviews: {
			pharmacy: r.one.pharmacies({
				from: r.pharmacyReviews.pharmacyId,
				to: r.pharmacies.id,
			}),
			user: r.one.users({
				from: r.pharmacyReviews.userId,
				to: r.users.id,
			}),
		},
		productReviews: {
			product: r.one.medicalProducts({
				from: r.productReviews.productId,
				to: r.medicalProducts.id,
			}),
			user: r.one.users({
				from: r.productReviews.userId,
				to: r.users.id,
			}),
		},
	})
)

// ============================================================================
// SCHEMA
// ============================================================================
export const schema = Object.assign(
	{
		users,
		sessions,
		accounts,
		verifications,
		staff,
		pharmacies,
		pharmacyStaff,
		productCategories,
		medicalProducts,
		pharmacyInventory,
		productSearches,
		productReservations,
		pharmacyReviews,
		productReviews,
	},
	relations
)
