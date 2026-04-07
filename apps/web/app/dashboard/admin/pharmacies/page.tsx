"use client"

import { useState } from "react"

import { Button } from "@/core/components/ui/button"
import { Card, CardContent } from "@/core/components/ui/card"
import { Input } from "@/core/components/ui/input"
import { useToast } from "@/core/components/ui/use-toast"
import { DashboardLayout } from "@/features/dashboard/components/DashboardLayout"
import {
	useAdminPharmaciesQuery,
	usePharmacyCertificateReviewMutation,
} from "@/features/pharmacies/api/pharmacies.hooks"

type VerificationStatus = "pending" | "approved" | "rejected"

export default function AdminPharmaciesPage() {
	const { toast } = useToast()
	const [status, setStatus] = useState<VerificationStatus>("pending")
	const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({})
	const { data, isLoading, isError } = useAdminPharmaciesQuery(status)
	const reviewMutation = usePharmacyCertificateReviewMutation()

	const handleReview = async (id: string, nextStatus: "approved" | "rejected") => {
		try {
			await reviewMutation.mutateAsync({
				id,
				status: nextStatus,
				reviewNote: reviewNotes[id] || undefined,
			})
			toast({
				title: `Certificate ${nextStatus}`,
			})
		} catch (error: unknown) {
			toast({
				title: "Review failed",
				description: error instanceof Error ? error.message : "Unknown error",
				variant: "destructive",
			})
		}
	}

	return (
		<DashboardLayout role="admin">
			<div className="space-y-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-foreground">
						Pharmacy Certificate Review
					</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						Review owner business certificates before enabling customer visibility.
					</p>
				</div>

				<div className="flex flex-wrap gap-2">
					{(["pending", "approved", "rejected"] as const).map(s => (
						<Button
							key={s}
							variant={status === s ? "default" : "outline"}
							size="sm"
							onClick={() => setStatus(s)}
						>
							{s.toUpperCase()}
						</Button>
					))}
				</div>

				{isLoading && <p className="text-sm text-muted-foreground">Loading pharmacies...</p>}
				{isError && (
					<p className="text-sm text-destructive">Failed to load pharmacies for review.</p>
				)}

				<div className="space-y-3">
					{(data ?? []).map(pharmacy => (
						<Card key={pharmacy.id}>
							<CardContent className="space-y-3 p-4">
								<div>
									<p className="font-medium text-foreground">{pharmacy.name}</p>
									<p className="text-xs text-muted-foreground">
										{pharmacy.city}, {pharmacy.state}
									</p>
									<p className="text-xs text-muted-foreground">
										Status: {pharmacy.certificateStatus ?? "pending"}
									</p>
									<p className="text-xs text-muted-foreground">
										Certificate #: {pharmacy.certificateNumber ?? "N/A"}
									</p>
								</div>

								{pharmacy.certificateFileUrl && (
									<a
										href={pharmacy.certificateFileUrl}
										target="_blank"
										rel="noreferrer"
										className="text-sm text-primary underline underline-offset-4"
									>
										View certificate
									</a>
								)}

								<Input
									placeholder="Optional review note"
									value={reviewNotes[pharmacy.id] ?? ""}
									onChange={e =>
										setReviewNotes(prev => ({ ...prev, [pharmacy.id]: e.target.value }))
									}
								/>

								<div className="flex gap-2">
									<Button
										size="sm"
										onClick={() => void handleReview(pharmacy.id, "approved")}
										disabled={reviewMutation.isPending}
									>
										Approve
									</Button>
									<Button
										size="sm"
										variant="destructive"
										onClick={() => void handleReview(pharmacy.id, "rejected")}
										disabled={reviewMutation.isPending}
									>
										Reject
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</DashboardLayout>
	)
}
