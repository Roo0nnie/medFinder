import { relations } from "drizzle-orm"
import { boolean, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core"

/**
 * Better Auth users table
 * Stores core user profile information
 */
export const users = pgTable("users", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	image: text("image"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

/**
 * Better Auth sessions table
 * Manages active user sessions
 */
export const sessions = pgTable("sessions", {
	id: text("id").primaryKey(),
	token: text("token").notNull().unique(),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	expiresAt: timestamp("expires_at").notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

/**
 * Better Auth accounts table
 * Stores OAuth provider accounts and credentials
 */
export const accounts = pgTable(
	"accounts",
	{
		id: text("id"),
		accountId: text("account_id").notNull(),
		providerId: text("provider_id").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		idToken: text("id_token"),
		accessTokenExpiresAt: timestamp("access_token_expires_at"),
		refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
		scope: text("scope"),
		password: text("password"), // For email/password auth
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	table => ({
		// Composite primary key on provider and account
		providerAccount: primaryKey({ columns: [table.providerId, table.accountId] }),
	})
)

/**
 * Better Auth verifications table
 * Handles temporary verification codes for email verification and password resets
 */
export const verifications = pgTable(
	"verifications",
	{
		id: text("id"),
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: timestamp("expires_at").notNull(),
		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at").defaultNow(),
	},
	table => ({
		// Composite primary key on identifier and value
		identifierValue: primaryKey({ columns: [table.identifier, table.value] }),
	})
)

/**
 * Drizzle relations for Better Auth tables
 */
export const usersRelations = relations(users, ({ many }) => ({
	sessions: many(sessions),
	accounts: many(accounts),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id],
	}),
}))

export const accountsRelations = relations(accounts, ({ one }) => ({
	user: one(users, {
		fields: [accounts.userId],
		references: [users.id],
	}),
}))
