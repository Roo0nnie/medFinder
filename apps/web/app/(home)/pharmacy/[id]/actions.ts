"use server"

import { desc, eq } from "drizzle-orm"
import { createDBClient } from "@repo/db/client"
import { pharmacyReviews } from "@repo/db/schema"
import { getSession } from "@/services/better-auth/auth-server"

export type PharmacyReviewRow = {
	id: string
	pharmacyId: string
	userId: string
	rating: number
	comment: string | null
	createdAt: Date
}

export async function getPharmacyReviews(
	pharmacyId: string
): Promise<{ reviews: PharmacyReviewRow[]; averageRating: number | null }> {
	const db = createDBClient()
	const rows = await db
		.select()
		.from(pharmacyReviews)
		.where(eq(pharmacyReviews.pharmacyId, pharmacyId))
		.orderBy(desc(pharmacyReviews.createdAt))

	const reviews: PharmacyReviewRow[] = rows.map((r) => ({
		id: r.id,
		pharmacyId: r.pharmacyId,
		userId: r.userId,
		rating: r.rating,
		comment: r.comment,
		createdAt: r.createdAt,
	}))

	const averageRating =
		reviews.length > 0
			? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
			: null

	return { reviews, averageRating }
}

export async function submitPharmacyReview(
	pharmacyId: string,
	rating: number,
	comment: string | null
): Promise<{ ok: boolean; error?: string }> {
	const session = await getSession()
	if (!session?.user?.id) {
		return { ok: false, error: "You must be logged in to submit a review." }
	}
	if (rating < 1 || rating > 5) {
		return { ok: false, error: "Rating must be between 1 and 5." }
	}

	const db = createDBClient()
	const id = crypto.randomUUID()
	try {
		await db.insert(pharmacyReviews).values({
			id,
			pharmacyId,
			userId: session.user.id,
			rating,
			comment: comment ?? null,
		})
		return { ok: true }
	} catch (err) {
		console.error("submitPharmacyReview:", err)
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Failed to submit review.",
		}
	}
}
