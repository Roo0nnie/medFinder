"use server"

import { and, desc, eq } from "drizzle-orm"
import { createDBClient } from "@repo/db/client"
import { pharmacyReviews, users } from "@repo/db/schema"
import { getSession } from "@/services/better-auth/auth-server"

export type PharmacyReviewRow = {
	id: string
	pharmacyId: string
	userId: string
	rating: number
	comment: string | null
	createdAt: Date
	reviewerName: string
	reviewerImage: string | null
}

function displayReviewerName(
	name: string | null,
	firstName: string | null,
	lastName: string | null
): string {
	if (name?.trim()) return name.trim()
	if (firstName != null && lastName != null)
		return `${firstName.trim()} ${lastName.trim()}`.trim()
	if (lastName != null) return lastName.trim()
	return "Anonymous"
}

export async function getPharmacyReviews(
	pharmacyId: string
): Promise<{
	reviews: PharmacyReviewRow[]
	averageRating: number | null
	reviewCount: number
}> {
	try {
		const db = createDBClient()
		const rows = await db
			.select({
				id: pharmacyReviews.id,
				pharmacyId: pharmacyReviews.pharmacyId,
				userId: pharmacyReviews.userId,
				rating: pharmacyReviews.rating,
				comment: pharmacyReviews.comment,
				createdAt: pharmacyReviews.createdAt,
				userName: users.name,
				userFirstName: users.first_name,
				userLastName: users.last_name,
				userImage: users.image,
			})
			.from(pharmacyReviews)
			.leftJoin(users, eq(pharmacyReviews.userId, users.id))
			.where(eq(pharmacyReviews.pharmacyId, pharmacyId))
			.orderBy(desc(pharmacyReviews.createdAt))

		const reviews: PharmacyReviewRow[] = rows.map((r) => ({
			id: r.id,
			pharmacyId: r.pharmacyId,
			userId: r.userId,
			rating: r.rating,
			comment: r.comment,
			createdAt: r.createdAt,
			reviewerName: displayReviewerName(
				r.userName,
				r.userFirstName,
				r.userLastName
			),
			reviewerImage: r.userImage ?? null,
		}))

		const averageRating =
			reviews.length > 0
				? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
				: null

		return { reviews, averageRating, reviewCount: reviews.length }
	} catch (error) {
		console.error("getPharmacyReviews:", error)
		return { reviews: [], averageRating: null, reviewCount: 0 }
	}
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
	const existingReview = await db
		.select({ id: pharmacyReviews.id })
		.from(pharmacyReviews)
		.where(
			and(
				eq(pharmacyReviews.pharmacyId, pharmacyId),
				eq(pharmacyReviews.userId, session.user.id)
			)
		)
		.limit(1)
	if (existingReview.length > 0) {
		return {
			ok: false,
			error: "You have already rated this pharmacy. Each customer can rate only once.",
		}
	}

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
