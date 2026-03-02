"use client"

import { useCallback, useEffect, useState } from "react"

import { Button } from "@/core/components/ui/button"
import { Card, CardContent } from "@/core/components/ui/card"
import { Input } from "@/core/components/ui/input"

import { getProductReviews, submitProductReview, type ProductReviewRow } from "./actions"

export function ProductDetailClient({
	productId,
	initialRating,
}: {
	productId: string
	initialRating?: number
}) {
	const [reviews, setReviews] = useState<ProductReviewRow[]>([])
	const [averageRating, setAverageRating] = useState<number | null>(initialRating ?? null)
	const [loading, setLoading] = useState(true)
	const [rating, setRating] = useState(3)
	const [comment, setComment] = useState("")
	const [submitting, setSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const load = useCallback(async () => {
		setLoading(true)
		const result = await getProductReviews(productId)
		setReviews(result.reviews)
		setAverageRating(result.averageRating ?? initialRating ?? null)
		setLoading(false)
	}, [productId, initialRating])

	useEffect(() => {
		load()
	}, [load])

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setSubmitting(true)
		setError(null)
		const result = await submitProductReview(productId, rating, comment || null)
		setSubmitting(false)
		if (result.ok) {
			setComment("")
			await load()
		} else {
			setError(result.error ?? "Failed to submit")
		}
	}

	const displayRating = averageRating != null ? averageRating.toFixed(1) : "—"

	return (
		<Card>
			<CardContent className="p-6">
				<h2 className="text-lg font-semibold">User feedback & rating</h2>
				<p className="text-muted-foreground mt-1 text-sm">
					Average rating: {displayRating} / 5
					{reviews.length > 0 && ` (${reviews.length} review${reviews.length !== 1 ? "s" : ""})`}
				</p>

				<form onSubmit={handleSubmit} className="mt-4 space-y-3">
					<div>
						<label htmlFor="product-review-rating" className="text-sm font-medium">
							Your rating (1–5)
						</label>
						<select
							id="product-review-rating"
							value={rating}
							onChange={e => setRating(Number(e.target.value))}
							className="border-input mt-1 block w-full max-w-[8rem] rounded-lg border bg-transparent px-3 py-2 text-sm"
						>
							{[1, 2, 3, 4, 5].map(n => (
								<option key={n} value={n}>
									{n}
								</option>
							))}
						</select>
					</div>
					<div>
						<label htmlFor="product-review-comment" className="text-sm font-medium">
							Comment (optional)
						</label>
						<Input
							id="product-review-comment"
							value={comment}
							onChange={e => setComment(e.target.value)}
							placeholder="Share your experience..."
							className="mt-1"
						/>
					</div>
					{error && <p className="text-destructive text-sm">{error}</p>}
					<Button type="submit" disabled={submitting}>
						{submitting ? "Submitting..." : "Submit review"}
					</Button>
				</form>

				{loading ? (
					<p className="text-muted-foreground mt-4 text-sm">Loading reviews...</p>
				) : reviews.length === 0 ? (
					<p className="text-muted-foreground mt-4 text-sm">No reviews yet. Be the first!</p>
				) : (
					<ul className="mt-4 space-y-3 border-t pt-4">
						{reviews.map(r => (
							<li key={r.id} className="text-sm">
								<span className="font-medium">{r.rating} / 5</span>
								{r.comment && <p className="text-muted-foreground mt-0.5">{r.comment}</p>}
								<p className="text-muted-foreground mt-0.5 text-xs">
									{new Date(r.createdAt).toLocaleDateString()}
								</p>
							</li>
						))}
					</ul>
				)}
			</CardContent>
		</Card>
	)
}
