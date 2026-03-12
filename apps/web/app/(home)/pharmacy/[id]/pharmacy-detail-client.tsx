"use client"

import { useCallback, useEffect, useState } from "react"
import { MapPinned, Star, MessageSquare } from "lucide-react"

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
import { Textarea } from "@/core/components/ui/textarea"
import { StarRating } from "@/core/components/ui/star-rating"

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
		<Card className="overflow-hidden border-border/50 bg-card/50 shadow-sm backdrop-blur-sm transition-shadow duration-300 hover:shadow-md">
			<CardContent className="p-6">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<h2 className="text-xl font-semibold tracking-tight">User reviews</h2>
						<p className="text-muted-foreground mt-2 text-sm">
							Read what other customers say about this pharmacy.
						</p>
					</div>
					<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
						<DialogTrigger>
							<Button className="transition-all hover:scale-[1.02] active:scale-[0.98]">
								Write a review
							</Button>
						</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Rate this pharmacy</DialogTitle>
							<DialogDescription>Share a short review and a rating from 1 to 5.</DialogDescription>
						</DialogHeader>
						<form onSubmit={handleSubmit} className="mt-3 space-y-3">
							<div className="flex flex-col gap-2">
								<label className="text-sm font-medium text-foreground/90">Your rating</label>
								<StarRating rating={rating} onRatingChange={setRating} />
							</div>
							<div className="flex flex-col gap-2">
								<label htmlFor="pharmacy-review-comment" className="text-sm font-medium text-foreground/90">
									Share your experience (optional)
								</label>
								<Textarea
									id="pharmacy-review-comment"
									value={comment}
									onChange={e => setComment(e.target.value)}
									placeholder="Tell us what you think..."
									className="min-h-[100px] resize-none transition-shadow focus-visible:ring-primary/20"
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
				<div className="mt-8 space-y-4">
					<div className="h-4 w-1/4 animate-pulse rounded bg-muted/50"></div>
					<div className="h-4 w-full animate-pulse rounded bg-muted/50"></div>
					<div className="h-4 w-3/4 animate-pulse rounded bg-muted/50"></div>
				</div>
			) : reviews.length === 0 ? (
				<div className="mt-8 flex flex-col items-center justify-center space-y-3 rounded-xl border border-dashed py-8 text-center animate-in fade-in zoom-in duration-500 fill-mode-both">
					<div className="rounded-full bg-muted/50 p-3">
						<MessageSquare className="h-6 w-6 text-muted-foreground/60" />
					</div>
					<div className="space-y-1">
						<p className="text-sm font-medium">No reviews yet</p>
						<p className="text-muted-foreground text-xs text-balance">
							Be the first to share your experience with this pharmacy.
						</p>
					</div>
				</div>
			) : (
				<ul className="mt-8 space-y-4">
					{reviews.map((r, i) => (
						<li 
							key={r.id} 
							className="group flex gap-4 rounded-xl border border-transparent bg-muted/20 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-border/50 hover:bg-muted/30 hover:shadow-sm animate-in fade-in slide-in-from-bottom-4"
							style={{ animationDelay: `${i * 75}ms`, animationFillMode: "both" }}
						>
							<div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
								<MapPinned className="h-5 w-5" />
							</div>
							<div className="flex flex-col gap-1.5 w-full">
								<div className="flex items-center justify-between">
									<span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
										<Star className="h-3.5 w-3.5 fill-current" />
										{r.rating}
									</span>
									<span className="text-muted-foreground text-xs font-medium">
										{new Date(r.createdAt).toLocaleDateString()}
									</span>
								</div>
								{r.comment && <p className="text-foreground/90 mt-1 text-sm leading-relaxed">{r.comment}</p>}
							</div>
						</li>
					))}
				</ul>
			)}
			</CardContent>
		</Card>
	)
}
