"use server"

import { desc, eq } from "drizzle-orm"
import { createDBClient } from "@repo/db/client"
import { productReviews } from "@repo/db/schema"
import { getSession } from "@/services/better-auth/auth-server"

export type ProductReviewRow = {
	id: string
	productId: string
	userId: string
	rating: number
	comment: string | null
	createdAt: Date
}

export async function getProductReviews(
	productId: string
): Promise<{ reviews: ProductReviewRow[]; averageRating: number | null }> {
	const db = createDBClient()
	const rows = await db
		.select()
		.from(productReviews)
		.where(eq(productReviews.productId, productId))
		.orderBy(desc(productReviews.createdAt))

	const reviews: ProductReviewRow[] = rows.map((r) => ({
		id: r.id,
		productId: r.productId,
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

export async function submitProductReview(
	productId: string,
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
		await db.insert(productReviews).values({
			id,
			productId,
			userId: session.user.id,
			rating,
			comment: comment ?? null,
		})
		return { ok: true }
	} catch (err) {
		console.error("submitProductReview:", err)
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Failed to submit review.",
		}
	}
}
