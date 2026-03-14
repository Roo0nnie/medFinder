"use client"

import { useCallback, useEffect, useState } from "react"
import { MessageSquare, Star, User } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/core/components/ui/avatar"
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
import { StarRating } from "@/core/components/ui/star-rating"
import { Textarea } from "@/core/components/ui/textarea"

import { getPharmacyReviews, submitPharmacyReview, type PharmacyReviewRow } from "./actions"

export function PharmacyDetailClient({
	pharmacyId,
	initialRating,
	initialAverageRating,
	initialReviewCount = 0,
	initialReviews,
}: {
	pharmacyId: string
	initialRating?: number
	initialAverageRating?: number | null
	initialReviewCount?: number
	initialReviews?: PharmacyReviewRow[]
}) {
	const [reviews, setReviews] = useState<PharmacyReviewRow[]>(initialReviews ?? [])
	const [averageRating, setAverageRating] = useState<number | null>(
		initialAverageRating ?? initialRating ?? null
	)
	const [reviewCount, setReviewCount] = useState(initialReviewCount)
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
		setReviewCount(result.reviewCount)
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
		<Card className="border-border/50 bg-card/50 overflow-hidden shadow-sm backdrop-blur-sm transition-shadow duration-300 hover:shadow-md">
			<CardContent className="p-6">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<h2 className="text-xl font-semibold tracking-tight">User reviews</h2>
						<div className="mt-2 flex flex-wrap items-center gap-3">
							{averageRating != null && (
								<div className="bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full px-3 py-1">
									<Star className="h-4 w-4 fill-current" />
									<span className="font-semibold">{averageRating.toFixed(1)}</span>
									<span className="text-primary/80 text-xs">/ 5</span>
									{reviewCount > 0 && (
										<span className="text-primary/80 text-xs">
											({reviewCount} rating{reviewCount !== 1 ? "s" : ""})
										</span>
									)}
								</div>
							)}
							<p className="text-muted-foreground text-sm">
								Read what other customers say. Each customer can rate this pharmacy only once.
							</p>
						</div>
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
								<DialogDescription>
									Share a short review and a rating from 1 to 5. You can only rate this pharmacy once.
								</DialogDescription>
							</DialogHeader>
							<form onSubmit={handleSubmit} className="mt-3 space-y-3">
								<div className="flex flex-col gap-2">
									<label className="text-foreground/90 text-sm font-medium">Your rating</label>
									<StarRating rating={rating} onRatingChange={setRating} />
								</div>
								<div className="flex flex-col gap-2">
									<label
										htmlFor="pharmacy-review-comment"
										className="text-foreground/90 text-sm font-medium"
									>
										Share your experience (optional)
									</label>
									<Textarea
										id="pharmacy-review-comment"
										value={comment}
										onChange={e => setComment(e.target.value)}
										placeholder="Tell us what you think..."
										className="focus-visible:ring-primary/20 min-h-[100px] resize-none transition-shadow"
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
						<div className="bg-muted/50 h-4 w-1/4 animate-pulse rounded"></div>
						<div className="bg-muted/50 h-4 w-full animate-pulse rounded"></div>
						<div className="bg-muted/50 h-4 w-3/4 animate-pulse rounded"></div>
					</div>
				) : reviews.length === 0 ? (
					<div className="animate-in fade-in zoom-in fill-mode-both mt-8 flex flex-col items-center justify-center space-y-3 rounded-xl border border-dashed py-8 text-center duration-500">
						<div className="bg-muted/50 rounded-full p-3">
							<MessageSquare className="text-muted-foreground/60 h-6 w-6" />
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
								className="group bg-muted/20 hover:border-border/50 hover:bg-muted/30 animate-in fade-in slide-in-from-bottom-4 flex gap-4 rounded-xl border border-transparent p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-sm"
								style={{ animationDelay: `${i * 75}ms`, animationFillMode: "both" }}
							>
								<Avatar size="lg" className="h-10 w-10 shrink-0">
									<AvatarImage src={r.reviewerImage ?? undefined} alt={r.reviewerName} />
									<AvatarFallback className="bg-primary/10 text-primary">
										{r.reviewerName.charAt(0).toUpperCase() || <User className="h-5 w-5" />}
									</AvatarFallback>
								</Avatar>
								<div className="flex min-w-0 flex-1 flex-col gap-1.5">
									<div className="flex flex-wrap items-center justify-between gap-2">
										<span className="text-foreground font-medium">{r.reviewerName}</span>
										<div className="flex items-center gap-2">
											<span className="bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
												<Star className="h-3.5 w-3.5 fill-current" />
												{r.rating}
											</span>
											<span className="text-muted-foreground text-xs font-medium">
												{new Date(r.createdAt).toLocaleDateString()}
											</span>
										</div>
									</div>
									{r.comment && (
										<p className="text-foreground/90 mt-1 text-sm leading-relaxed">{r.comment}</p>
									)}
								</div>
							</li>
						))}
					</ul>
				)}
			</CardContent>
		</Card>
	)
}
