import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { z } from "zod"

import { getAuth } from "@repo/auth"
import { createDBClient } from "@repo/db/client"
import { staff, users } from "@repo/db/schema"

import { env } from "@/env"
import { getSession } from "@/services/better-auth/auth-server"

const requestSchema = z.object({
	account: z.object({
		firstName: z.string().min(1, "First name is required"),
		lastName: z.string().min(1, "Last name is required"),
		middleName: z.string().optional(),
		email: z.string().email(),
		password: z.string().min(8, "Password must be at least 8 characters"),
	}),
	staff: z.object({
		department: z.string().min(1, "Department is required"),
		position: z.string().min(1, "Position is required"),
		specialization: z.string().optional(),
		bio: z.string().optional(),
		phone: z.string().optional(),
		isActive: z.boolean().optional(),
	}),
})

export async function POST(req: Request) {
	const json = await req.json().catch(() => null)
	const parsed = requestSchema.safeParse(json)

	if (!parsed.success) {
		return NextResponse.json(
			{ message: "Invalid input", issues: parsed.error.flatten() },
			{ status: 400 },
		)
	}

	const { account, staff: staffInput } = parsed.data
	const auth = getAuth()

	// 1) Create the Better Auth user with a staff role (server-side to avoid swapping the caller's session)
	try {
		const fullName = `${account.firstName} ${account.lastName}`.trim() || account.email
		await auth.api.signUpEmail({
			body: {
				name: fullName,
				email: account.email,
				password: account.password,
				// Additional fields are supported at runtime but not in the TS type
				firstName: account.firstName,
				lastName: account.lastName,
				middleName: account.middleName,
				role: "staff",
				rememberMe: false,
			} as { name: string; email: string; password: string },
		})
	} catch (error) {
		const message =
			error instanceof Error
				? error.message
				: "Failed to create staff account"
		return NextResponse.json({ message }, { status: 422 })
	}

	// 2) Look up the newly created user to get their ID
	const db = createDBClient()
	const createdUsers = await db
		.select()
		.from(users)
		.where(eq(users.email, account.email.toLowerCase()))
		.limit(1)

	const createdUser = createdUsers[0]

	if (!createdUser) {
		return NextResponse.json(
			{ message: "Account was created but user record was not found" },
			{ status: 500 },
		)
	}

	// 3) Get the current owner session to determine ownerId for the staff row
	const session = await getSession()
	if (!session || !session.user || (session.user as any).role !== "owner") {
		return NextResponse.json(
			{ message: "Only authenticated owners can create staff profiles" },
			{ status: 403 },
		)
	}

	const ownerId = String((session.user as any).id)

	// 4) Insert staff profile directly into the shared staff table
	const inserted = await db
		.insert(staff)
		.values({
			id: crypto.randomUUID(),
			userId: createdUser.id,
			ownerId,
			department: staffInput.department,
			position: staffInput.position,
			specialization: staffInput.specialization ?? null,
			bio: staffInput.bio ?? null,
			phone: staffInput.phone ?? null,
			isActive: staffInput.isActive ?? true,
		})
		.returning()

	const staffData = inserted[0]

	return NextResponse.json(
		{
			user: {
				id: createdUser.id,
				email: createdUser.email,
				firstName: createdUser.first_name,
				lastName: createdUser.last_name,
				role: createdUser.role,
			},
			staff: staffData,
		},
		{ status: 201 },
	)
}
