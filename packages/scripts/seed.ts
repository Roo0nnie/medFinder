/**
 * Seed script: creates 4 users (admin, owner, staff, customer) for development.
 * Run from repo root: pnpm dev:seed
 * Requires: DATABASE_URL (packages/db/.env), BETTER_AUTH_SECRET + BETTER_AUTH_TRUSTED_ORIGINS (apps/web/.env)
 */
import "./load-env"

import { eq } from "drizzle-orm"

import { getAuth } from "@repo/auth"
import { createDBClient } from "@repo/db/client"
import { users } from "@repo/db/schema"

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
		} catch (err) {
			console.error(`Failed to create ${u.email}:`, err instanceof Error ? err.message : err)
		}
	}
	console.log("Seed complete.")
	process.exit(0)
}

seed().catch(err => {
	console.error(err)
	process.exit(1)
})
