"use client"

import { useCallback, useEffect, useState } from "react"
import { Star, MessageSquare } from "lucide-react"

import { Button } from "@/core/components/ui/button"
import { Card, CardContent } from "@/core/components/ui/card"
import { Textarea } from "@/core/components/ui/textarea"
import { StarRating } from "@/core/components/ui/star-rating"

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
		<div className="animate-in fade-in slide-in-from-bottom-4 mt-8 fill-mode-both delay-150 duration-500">
			<Card className="overflow-hidden border-border/50 bg-card/50 shadow-sm backdrop-blur-sm transition-shadow duration-300 hover:shadow-md">
				<CardContent className="p-6">
					<h2 className="text-xl font-semibold tracking-tight">Customer Reviews</h2>
					<div className="mt-2 flex items-center gap-2">
						<div className="flex items-baseline gap-1">
							<span className="text-2xl font-bold">{displayRating}</span>
							<span className="text-muted-foreground text-sm font-medium">/ 5</span>
						</div>
						{reviews.length > 0 && (
							<span className="text-muted-foreground text-sm">
								· {reviews.length} review{reviews.length !== 1 ? "s" : ""}
							</span>
						)}
					</div>

					<form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5 sm:max-w-md">
						<div className="flex flex-col gap-2">
							<label className="text-sm font-medium text-foreground/90">Your rating</label>
							<StarRating rating={rating} onRatingChange={setRating} />
						</div>
						<div className="flex flex-col gap-2">
							<label htmlFor="product-review-comment" className="text-sm font-medium text-foreground/90">
								Share your experience (optional)
							</label>
							<Textarea
								id="product-review-comment"
								value={comment}
								onChange={e => setComment(e.target.value)}
								placeholder="Tell us what you think..."
								className="min-h-[100px] resize-none transition-shadow focus-visible:ring-primary/20"
							/>
						</div>
						{error && <p className="text-destructive text-sm font-medium">{error}</p>}
						<Button type="submit" disabled={submitting} className="w-full sm:w-auto self-start transition-all hover:scale-[1.02] active:scale-[0.98]">
							{submitting ? "Submitting..." : "Submit review"}
						</Button>
					</form>

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
									Be the first to share your experience with this product.
								</p>
							</div>
						</div>
					) : (
						<ul className="mt-8 space-y-4">
							{reviews.map((r, i) => (
								<li
									key={r.id}
									className="group rounded-xl border border-transparent bg-muted/20 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-border/50 hover:bg-muted/30 hover:shadow-sm animate-in fade-in slide-in-from-bottom-4"
									style={{ animationDelay: `${i * 75}ms`, animationFillMode: "both" }}
								>
									<div className="flex items-center justify-between mb-3">
										<span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
											<Star className="h-3.5 w-3.5 fill-current" />
											{r.rating}
										</span>
										<span className="text-muted-foreground text-xs font-medium">
											{new Date(r.createdAt).toLocaleDateString()}
										</span>
									</div>
									{r.comment && <p className="text-foreground/90 text-sm leading-relaxed">{r.comment}</p>}
								</li>
							))}
						</ul>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
