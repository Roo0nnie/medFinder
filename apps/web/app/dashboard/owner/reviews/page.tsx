"use client"

import { useState } from "react"

import { Button } from "@/core/components/ui/button"
import { Card, CardContent } from "@/core/components/ui/card"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/core/components/ui/select"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/core/components/ui/table"
import { useMyPharmaciesQuery } from "@/features/pharmacies/api/pharmacies.hooks"
import {
	usePharmacyReviewDeleteMutation,
	usePharmacyReviewsQuery,
} from "@/features/reviews/api/reviews.hooks"

import { useToast } from "../../../../core/components/ui/use-toast"
import { DashboardLayout } from "../../../../features/dashboard/components/DashboardLayout"

export default function OwnerReviewsPage() {
	const { toast } = useToast()
	const { data: pharmacies } = useMyPharmaciesQuery()
	const [pharmacyId, setPharmacyId] = useState<string>("")
	const [ratingFilter, setRatingFilter] = useState<string>("")
	const selectedRating = ratingFilter ? Number(ratingFilter) : undefined
	const reviewsQuery = usePharmacyReviewsQuery(pharmacyId || undefined, selectedRating, {
		enabled: true,
	})
	const deleteMutation = usePharmacyReviewDeleteMutation()

	const handleDelete = async (id: string) => {
		try {
			await deleteMutation.mutateAsync(id)
			toast({ title: "Review deleted" })
		} catch (e: any) {
			toast({ title: "Delete failed", description: e.message, variant: "destructive" })
		}
	}

	return (
		<DashboardLayout role="owner">
			<div className="space-y-6">
				<div>
					<h1 className="text-foreground text-3xl font-bold tracking-tight">Reviews</h1>
					<p className="text-muted-foreground mt-2 text-sm">
						View and moderate reviews for your pharmacies.
					</p>
				</div>

				<Card>
					<CardContent className="space-y-3 p-4 sm:p-6">
						<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<h2 className="text-lg font-semibold">Pharmacy reviews</h2>
							<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
								<Select value={pharmacyId} onValueChange={v => setPharmacyId(v ?? "")}>
									<SelectTrigger className="w-full sm:w-64">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="">All my pharmacies</SelectItem>
										{pharmacies?.map(ph => (
											<SelectItem key={ph.id} value={ph.id}>
												{ph.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<Select value={ratingFilter} onValueChange={v => setRatingFilter(v ?? "")}>
									<SelectTrigger className="w-full sm:w-40">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="">All ratings</SelectItem>
										<SelectItem value="5">5 stars</SelectItem>
										<SelectItem value="4">4 stars</SelectItem>
										<SelectItem value="3">3 stars</SelectItem>
										<SelectItem value="2">2 stars</SelectItem>
										<SelectItem value="1">1 star</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						{reviewsQuery.isLoading && <p className="text-muted-foreground text-sm">Loading...</p>}
						{reviewsQuery.isError && (
							<p className="text-destructive text-sm">
								{reviewsQuery.error instanceof Error
									? reviewsQuery.error.message
									: "Failed to load reviews."}
							</p>
						)}

						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Customer</TableHead>
										{!pharmacyId && <TableHead>Pharmacy</TableHead>}
										<TableHead>Rating</TableHead>
										<TableHead>Comment</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{reviewsQuery.data?.map(review => (
										<TableRow key={review.id}>
											<TableCell className="max-w-xs">
												<div className="flex items-center gap-2">
													{review.user?.image ? (
														<img
															src={review.user.image}
															alt={review.user.firstName || review.user.lastName || "Customer"}
															className="h-8 w-8 rounded-full object-cover"
														/>
													) : (
														<div className="bg-muted text-muted-foreground flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium">
															{review.user?.firstName?.[0] ?? review.user?.lastName?.[0] ?? "?"}
														</div>
													)}
													<span className="text-sm font-medium">
														{review.user?.firstName || review.user?.lastName
															? `${review.user?.firstName ?? ""} ${review.user?.lastName ?? ""}`.trim()
															: "Customer"}
													</span>
												</div>
											</TableCell>
											{!pharmacyId && (
												<TableCell className="text-muted-foreground text-sm">
													{review.pharmacyName ?? review.pharmacyId}
												</TableCell>
											)}
											<TableCell className="font-semibold">{review.rating}/5</TableCell>
											<TableCell className="max-w-xl">
												<p className="text-sm">{review.comment || "No comment provided."}</p>
											</TableCell>
											<TableCell className="text-right">
												<Button
													size="sm"
													variant="ghost"
													className="text-destructive"
													onClick={() => handleDelete(review.id)}
												>
													Delete
												</Button>
											</TableCell>
										</TableRow>
									))}
									{!reviewsQuery.isLoading && (reviewsQuery.data?.length ?? 0) === 0 && (
										<TableRow>
											<TableCell
												colSpan={pharmacyId ? 4 : 5}
												className="text-muted-foreground text-center text-sm"
											>
												No reviews yet.
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>
			</div>
		</DashboardLayout>
	)
}
