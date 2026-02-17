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
// TODOs
// ============================================================================

export const todos = createTable("todos", t => ({
	id: t.serial("id").primaryKey(),
	title: t.text("title").notNull(),
	completed: t.boolean("completed").notNull().default(false),
	authorId: t
		.text("author_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	createdAt: t.timestamp("created_at").notNull().defaultNow(),
	updatedAt: t.timestamp("updated_at").notNull().defaultNow(),
}))

// ============================================================================
// RELATIONS
// ============================================================================
export const relations = defineRelations({ users, sessions, accounts, todos, staff }, r => ({
	users: {
		sessions: r.many.sessions(),
		accounts: r.many.accounts(),
		staffProfiles: r.many.staff(),
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
	todos: {
		author: r.one.users({
			from: r.todos.authorId,
			to: r.users.id,
		}),
	},
	staff: {
		user: r.one.users({
			from: r.staff.userId,
			to: r.users.id,
		}),
	},
}))

// ============================================================================
// SCHEMA
// ============================================================================
export const schema = Object.assign(
	{
		users,
		sessions,
		accounts,
		verifications,
		todos,
		staff,
	},
	relations
)
