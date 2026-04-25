"use client"

import Link from "next/link"

import { Card, CardContent } from "@/core/components/ui/card"
import { Badge } from "@/core/components/ui/badge"
import { Button } from "@/core/components/ui/button"
import { Separator } from "@/core/components/ui/separator"
import { DashboardLayout } from "@/features/dashboard/components/DashboardLayout"
import { usePharmacyReviewQuery } from "@/features/reviews/api/reviews.hooks"

export default function OwnerReviewDetailsPage({ params }: { params: { id: string } }) {
	const q = usePharmacyReviewQuery(params.id)
	const r = q.data

	return (
		<DashboardLayout role="owner">
			<div className="space-y-6">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-foreground text-3xl font-bold tracking-tight">Review details</h1>
						<p className="text-muted-foreground mt-2 text-sm">Full review information, including description.</p>
					</div>
					<Button asChild variant="outline">
						<Link href="/dashboard/owner/reviews">Back to reviews</Link>
					</Button>
				</div>

				<Card>
					<CardContent className="space-y-4 p-4 sm:p-6">
						{q.isLoading ? (
							<div className="text-muted-foreground text-sm">Loading…</div>
						) : q.isError ? (
							<div className="text-destructive text-sm">
								{q.error instanceof Error ? q.error.message : "Failed to load review."}
							</div>
						) : !r ? (
							<div className="text-muted-foreground text-sm">Review not found.</div>
						) : (
							<>
								<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
									<div className="space-y-1">
										<div className="text-sm font-semibold">Pharmacy</div>
										<div className="text-muted-foreground text-sm">{r.pharmacyName ?? r.pharmacyId}</div>
									</div>
									<Badge variant="secondary">{r.rating}/5</Badge>
								</div>

								<Separator />

								<div className="grid gap-4 sm:grid-cols-2">
									<div className="space-y-1">
										<div className="text-sm font-semibold">Customer</div>
										<div className="text-muted-foreground text-sm">
											{r.user?.firstName || r.user?.lastName
												? `${r.user?.firstName ?? ""} ${r.user?.lastName ?? ""}`.trim()
												: r.userId}
										</div>
									</div>
									<div className="space-y-1">
										<div className="text-sm font-semibold">Created</div>
										<div className="text-muted-foreground text-sm">
											{r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}
										</div>
									</div>
								</div>

								<Separator />

								<div className="space-y-2">
									<div className="text-sm font-semibold">Description</div>
									<div className="bg-muted/30 rounded-md p-3">
										<p className="text-sm whitespace-pre-wrap">{r.comment?.trim() ? r.comment : "—"}</p>
									</div>
								</div>
							</>
						)}
					</CardContent>
				</Card>
			</div>
		</DashboardLayout>
	)
}

