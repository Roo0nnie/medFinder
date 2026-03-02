"use client"

import { useCallback, useEffect, useState } from "react"
import { MapPinned } from "lucide-react"

import { Button } from "@/core/components/ui/button"
import { Card, CardContent } from "@/core/components/ui/card"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/core/components/ui/dialog"
import { Input } from "@/core/components/ui/input"

import { getPharmacyReviews, submitPharmacyReview, type PharmacyReviewRow } from "./actions"

export function PharmacyDetailClient({
	pharmacyId,
	initialRating,
	initialAverageRating,
	initialReviews,
}: {
	pharmacyId: string
	initialRating?: number
	initialAverageRating?: number | null
	initialReviews?: PharmacyReviewRow[]
}) {
	const [reviews, setReviews] = useState<PharmacyReviewRow[]>(initialReviews ?? [])
	const [averageRating, setAverageRating] = useState<number | null>(
		initialAverageRating ?? initialRating ?? null
	)
	const [loading, setLoading] = useState(!initialReviews)
	const [rating, setRating] = useState(3)
	const [comment, setComment] = useState("")
	const [submitting, setSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [dialogOpen, setDialogOpen] = useState(false)

	const load = useCallback(async () => {
		setLoading(true)
		const result = await getPharmacyReviews(pharmacyId)
		setReviews(result.reviews)
		setAverageRating(result.averageRating ?? initialAverageRating ?? initialRating ?? null)
		setLoading(false)
	}, [pharmacyId, initialAverageRating, initialRating])

	useEffect(() => {
		if (!initialReviews) {
			load()
		}
	}, [initialReviews, load])

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setSubmitting(true)
		setError(null)
		const result = await submitPharmacyReview(pharmacyId, rating, comment || null)
		setSubmitting(false)
		if (result.ok) {
			setComment("")
			await load()
			setDialogOpen(false)
		} else {
			setError(result.error ?? "Failed to submit")
		}
	}

	return (
		<CardContent className="p-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<h2 className="text-lg font-semibold">User reviews</h2>
					<p className="text-muted-foreground mt-1 text-sm">
						Read what other customers say about this pharmacy.
					</p>
				</div>
				<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
					<DialogTrigger>
						<Button size="sm" variant="outline">
							Write a review
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Rate this pharmacy</DialogTitle>
							<DialogDescription>Share a short review and a rating from 1 to 5.</DialogDescription>
						</DialogHeader>
						<form onSubmit={handleSubmit} className="mt-3 space-y-3">
							<div>
								<label htmlFor="pharmacy-review-rating" className="text-sm font-medium">
									Your rating (1–5)
								</label>
								<select
									id="pharmacy-review-rating"
									value={rating}
									onChange={e => setRating(Number(e.target.value))}
									className="border-input mt-1 block w-full max-w-32 rounded-lg border bg-transparent px-3 py-2 text-sm"
								>
									{[1, 2, 3, 4, 5].map(n => (
										<option key={n} value={n}>
											{n}
										</option>
									))}
								</select>
							</div>
							<div>
								<label htmlFor="pharmacy-review-comment" className="text-sm font-medium">
									Comment (optional)
								</label>
								<Input
									id="pharmacy-review-comment"
									value={comment}
									onChange={e => setComment(e.target.value)}
									placeholder="Share your experience..."
									className="mt-1"
								/>
							</div>
							{error && <p className="text-destructive text-sm">{error}</p>}
							<DialogFooter showCloseButton>
								<Button type="submit" disabled={submitting}>
									{submitting ? "Submitting..." : "Submit review"}
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			{loading ? (
				<p className="text-muted-foreground mt-4 text-sm">Loading reviews...</p>
			) : reviews.length === 0 ? (
				<p className="text-muted-foreground mt-4 text-sm">
					No reviews yet. Be the first to share your experience.
				</p>
			) : (
				<ul className="mt-4 space-y-3 border-t pt-4">
					{reviews.map(r => (
						<li key={r.id} className="text-sm">
							<MapPinned />
							<div className="flex flex-col gap-2">
								<span className="font-medium">{r.rating} / 5</span>
								{r.comment && <p className="text-muted-foreground mt-0.5">{r.comment}</p>}
								<p className="text-muted-foreground mt-0.5 text-xs">
									{new Date(r.createdAt).toLocaleDateString()}
								</p>
							</div>
						</li>
					))}
				</ul>
			)}
		</CardContent>
	)
}
