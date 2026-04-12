"use client"

import { useState } from "react"
import type { Route } from "next"
import Link from "next/link"

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/core/components/ui/alert-dialog"
import { Button } from "@/core/components/ui/button"
import { Card, CardContent } from "@/core/components/ui/card"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu"
import { Switch } from "@/core/components/ui/switch"
import { useToast } from "@/core/components/ui/use-toast"
import { DashboardLayout } from "@/features/dashboard/components/DashboardLayout"
import { EditPharmacyStepperDialog } from "@/features/pharmacies/components/edit-pharmacy-stepper-dialog"
import { OwnerPharmacyVerificationNoticeDialog } from "@/features/pharmacies/components/owner-pharmacy-verification-notice-dialog"
import { formatPharmacyAddressLine } from "@/features/pharmacies/components/pharmacy-storefront-meta"
import {
	useMyPharmaciesQuery,
	usePharmacyDeleteMutation,
	usePharmacyUpdateMutation,
	type Pharmacy,
} from "@/features/pharmacies/api/pharmacies.hooks"

export default function OwnerPharmaciesPage() {
	const { toast } = useToast()
	const { data: pharmacies, isLoading, isError, refetch } = useMyPharmaciesQuery()
	const updateMutation = usePharmacyUpdateMutation()
	const deleteMutation = usePharmacyDeleteMutation()

	const [dialogOpen, setDialogOpen] = useState(false)
	const [dialogMode, setDialogMode] = useState<"create" | "edit">("create")
	const [deleteOpen, setDeleteOpen] = useState(false)

	const pharmacy = pharmacies?.length ? pharmacies[0]! : null
	const isCertificateApproved = pharmacy?.certificateStatus === "approved"

	const openCreate = () => {
		setDialogMode("create")
		setDialogOpen(true)
	}

	const openEdit = () => {
		setDialogMode("edit")
		setDialogOpen(true)
	}

	const addressLine = pharmacy
		? formatPharmacyAddressLine({
				address: pharmacy.address,
				city: pharmacy.city,
				state: pharmacy.state,
				zipCode: pharmacy.zipCode,
				country: pharmacy.country,
			})
		: ""

	const handleActiveChange = async (checked: boolean) => {
		if (!pharmacy) return
		try {
			await updateMutation.mutateAsync({ id: pharmacy.id, isActive: checked })
			toast({ title: checked ? "Pharmacy is now visible" : "Pharmacy hidden from customers" })
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : "Update failed"
			toast({ title: "Could not update visibility", description: message, variant: "destructive" })
		}
	}

	const handleDelete = async () => {
		if (!pharmacy) return
		try {
			await deleteMutation.mutateAsync(pharmacy.id)
			toast({ title: "Pharmacy deleted" })
			setDeleteOpen(false)
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : "Delete failed"
			toast({ title: "Delete failed", description: message, variant: "destructive" })
		}
	}

	return (
		<DashboardLayout role="owner">
			<div className="space-y-8">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<h1 className="text-3xl font-bold tracking-tight text-foreground">My pharmacy</h1>
						<p className="mt-2 text-sm text-muted-foreground">
							Preview how customers see your storefront and keep details up to date.
						</p>
					</div>
				</div>

				{isLoading && <p className="text-muted-foreground text-sm">Loading...</p>}
				{isError && (
					<p className="text-destructive text-sm">
						Failed to load pharmacies. Check API base URL and session.
					</p>
				)}

				{!isLoading && !isError && !pharmacy && (
					<Card>
						<CardContent className="flex flex-col items-center gap-4 p-8 text-center sm:p-12">
							<p className="text-muted-foreground max-w-md text-sm">
								Set up your pharmacy profile. You can add one location per account.
							</p>
							<Button className="rounded-full px-8" onClick={openCreate}>
								Set up your pharmacy
							</Button>
						</CardContent>
					</Card>
				)}

				{pharmacy && (
					<div className="space-y-10">
						<Card>
							<CardContent className="p-4 sm:p-5">
								<p className="text-sm font-medium text-foreground">Business Certificate</p>
								<p className="mt-1 text-sm text-muted-foreground">
									Status:{" "}
									<span className="font-medium uppercase">
										{pharmacy.certificateStatus ?? "pending"}
									</span>
								</p>
								{pharmacy.certificateReviewNote && (
									<p className="mt-1 text-xs text-muted-foreground">
										Review note: {pharmacy.certificateReviewNote}
									</p>
								)}
							</CardContent>
						</Card>

						<Card>
							<CardContent className="p-4 sm:p-5">
								<div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
									<p className="text-sm font-medium text-foreground">Pharmacy details</p>
									<div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
										<Button  variant="secondary" className="rounded-full px-6">
											<Link href={`/pharmacy/${pharmacy.id}` as Route}>View My Pharmacy</Link>
										</Button>
										<Button className="rounded-full px-6" onClick={openEdit}>
											Edit pharmacy
										</Button>
										<div className="flex items-center gap-2 rounded-full border border-border px-3 py-2">
											<Switch
												id="owner-pharmacy-active"
												checked={pharmacy.isActive}
												disabled={updateMutation.isPending}
												onCheckedChange={v => void handleActiveChange(v)}
											/>
											<label
												htmlFor="owner-pharmacy-active"
												className="text-muted-foreground cursor-pointer text-sm font-normal"
											>
												Visible to customers
											</label>
										</div>
										<DropdownMenu>
											<DropdownMenuTrigger>
												<Button variant="outline" size="sm">
													More
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem
													className="text-destructive focus:text-destructive"
													onClick={() => setDeleteOpen(true)}
												>
													Delete pharmacy
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								</div>
								<dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
									<div>
										<dt className="text-muted-foreground">Name</dt>
										<dd className="text-foreground font-medium">{pharmacy.name}</dd>
									</div>
									<div>
										<dt className="text-muted-foreground">Pharmacy ID</dt>
										<dd className="text-foreground font-medium">{pharmacy.id}</dd>
									</div>
									<div className="sm:col-span-2">
										<dt className="text-muted-foreground">Description</dt>
										<dd className="text-foreground font-medium whitespace-pre-line">
											{pharmacy.description?.trim() ? pharmacy.description : "—"}
										</dd>
									</div>
									<div className="sm:col-span-2">
										<dt className="text-muted-foreground">Address</dt>
										<dd className="text-foreground font-medium">
											{addressLine.trim().length > 0 ? addressLine : "—"}
										</dd>
									</div>
									<div>
										<dt className="text-muted-foreground">Street</dt>
										<dd className="text-foreground font-medium">{pharmacy.address ?? "—"}</dd>
									</div>
									<div>
										<dt className="text-muted-foreground">City</dt>
										<dd className="text-foreground font-medium">{pharmacy.city ?? "—"}</dd>
									</div>
									<div>
										<dt className="text-muted-foreground">State</dt>
										<dd className="text-foreground font-medium">{pharmacy.state ?? "—"}</dd>
									</div>
									<div>
										<dt className="text-muted-foreground">Zip code</dt>
										<dd className="text-foreground font-medium">{pharmacy.zipCode ?? "—"}</dd>
									</div>
									<div>
										<dt className="text-muted-foreground">Country</dt>
										<dd className="text-foreground font-medium">{pharmacy.country ?? "—"}</dd>
									</div>
									<div>
										<dt className="text-muted-foreground">Phone</dt>
										<dd className="text-foreground font-medium">{pharmacy.phone ?? "—"}</dd>
									</div>
									<div>
										<dt className="text-muted-foreground">Email</dt>
										<dd className="text-foreground font-medium">{pharmacy.email ?? "—"}</dd>
									</div>
									<div>
										<dt className="text-muted-foreground">Website</dt>
										<dd className="text-foreground font-medium">{pharmacy.website ?? "—"}</dd>
									</div>
									<div>
										<dt className="text-muted-foreground">Operating hours</dt>
										<dd className="text-foreground font-medium whitespace-pre-line">
											{pharmacy.operatingHours?.trim() ? pharmacy.operatingHours : "—"}
										</dd>
									</div>
									<div>
										<dt className="text-muted-foreground">Owner ID</dt>
										<dd className="text-foreground font-medium">{pharmacy.ownerId ?? "—"}</dd>
									</div>
									<div>
										<dt className="text-muted-foreground">Certificate number</dt>
										<dd className="text-foreground font-medium">{pharmacy.certificateNumber ?? "—"}</dd>
									</div>
									<div>
										<dt className="text-muted-foreground">Certificate status</dt>
										<dd className="text-foreground font-medium uppercase">
											{pharmacy.certificateStatus ?? "—"}
										</dd>
									</div>
									<div className="sm:col-span-2">
										<dt className="text-muted-foreground">Certificate file</dt>
										<dd className="text-foreground font-medium">
											{pharmacy.certificateFileUrl ? (
												<a
													href={pharmacy.certificateFileUrl}
													target="_blank"
													rel="noreferrer"
													className="text-primary underline-offset-4 hover:underline"
												>
													View uploaded certificate
												</a>
											) : (
												"—"
											)}
										</dd>
									</div>
									<div>
										<dt className="text-muted-foreground">Latitude</dt>
										<dd className="text-foreground font-medium">
											{pharmacy.latitude != null ? String(pharmacy.latitude) : "—"}
										</dd>
									</div>
									<div>
										<dt className="text-muted-foreground">Longitude</dt>
										<dd className="text-foreground font-medium">
											{pharmacy.longitude != null ? String(pharmacy.longitude) : "—"}
										</dd>
									</div>
									<div className="sm:col-span-2">
										<dt className="text-muted-foreground">Google map embed</dt>
										<dd className="text-foreground font-medium break-all">
											{pharmacy.googleMapEmbed?.trim() ? pharmacy.googleMapEmbed : "—"}
										</dd>
									</div>
									<div className="sm:col-span-2">
										<dt className="text-muted-foreground">Social links</dt>
										<dd className="text-foreground font-medium break-all">
											{pharmacy.socialLinks?.trim() ? pharmacy.socialLinks : "—"}
										</dd>
									</div>
									<div>
										<dt className="text-muted-foreground">Logo</dt>
										<dd className="text-foreground font-medium break-all">{pharmacy.logo ?? "—"}</dd>
									</div>
									<div>
										<dt className="text-muted-foreground">Owner image</dt>
										<dd className="text-foreground font-medium break-all">
											{pharmacy.ownerImage ?? "—"}
										</dd>
									</div>
									<div>
										<dt className="text-muted-foreground">Created at</dt>
										<dd className="text-foreground font-medium">{pharmacy.createdAt ?? "—"}</dd>
									</div>
									<div>
										<dt className="text-muted-foreground">Updated at</dt>
										<dd className="text-foreground font-medium">{pharmacy.updatedAt ?? "—"}</dd>
									</div>
									<div>
										<dt className="text-muted-foreground">Visible to customers</dt>
										<dd className="text-foreground font-medium">{pharmacy.isActive ? "Yes" : "No"}</dd>
									</div>
								</dl>
							</CardContent>
						</Card>
					</div>
				)}

				<EditPharmacyStepperDialog
					open={dialogOpen}
					onOpenChange={setDialogOpen}
					mode={dialogMode}
					pharmacyId={pharmacy?.id}
					initial={(dialogMode === "edit" ? pharmacy : null) as Partial<Pharmacy> | null}
					onSaved={() => {
						void refetch()
						toast({
							title: dialogMode === "create" ? "Pharmacy created" : "Pharmacy updated",
						})
					}}
				/>

				<AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Delete this pharmacy?</AlertDialogTitle>
							<AlertDialogDescription>
								This removes the pharmacy and related data you are allowed to delete. This action
								cannot be undone.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction
								className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
								onClick={() => void handleDelete()}
							>
								Delete
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>

				{pharmacy && !isCertificateApproved && (
					<OwnerPharmacyVerificationNoticeDialog
						pharmacyId={pharmacy.id}
						certificateStatus={pharmacy.certificateStatus}
						continueLabel="Continue to my pharmacy"
						dismissalScope="dashboard"
					/>
				)}
			</div>
		</DashboardLayout>
	)
}
