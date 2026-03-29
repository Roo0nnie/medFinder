"use client"

import { useState } from "react"

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
import { PharmacyStorefrontHero } from "@/features/pharmacies/components/pharmacy-storefront-hero"
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

	const openCreate = () => {
		setDialogMode("create")
		setDialogOpen(true)
	}

	const openEdit = () => {
		setDialogMode("edit")
		setDialogOpen(true)
	}

	const mapEmbedUrl =
		pharmacy?.latitude != null && pharmacy?.longitude != null
			? `https://www.google.com/maps?q=${pharmacy.latitude},${pharmacy.longitude}&output=embed`
			: null
	const mapUrl =
		pharmacy?.latitude != null && pharmacy?.longitude != null
			? `https://www.google.com/maps?q=${pharmacy.latitude},${pharmacy.longitude}`
			: null

	const addressLine = pharmacy
		? formatPharmacyAddressLine({
				address: pharmacy.address,
				city: pharmacy.city,
				state: pharmacy.state,
				zipCode: pharmacy.zipCode,
				country: pharmacy.country,
			})
		: ""
	const externalMapFromAddress =
		pharmacy && !mapUrl && addressLine.trim().length > 0
			? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressLine)}`
			: null

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
						<PharmacyStorefrontHero
							name={pharmacy.name}
							description={pharmacy.description}
							ownerImage={pharmacy.ownerImage}
							logo={pharmacy.logo}
							addressLine={addressLine}
							phone={pharmacy.phone}
							email={pharmacy.email}
							website={pharmacy.website}
							operatingHours={pharmacy.operatingHours}
							mapEmbedUrl={mapEmbedUrl}
							externalMapUrl={mapUrl ?? externalMapFromAddress}
							isActive={pharmacy.isActive}
							showStatusBadge
							showEmptyImageHint
							hideLocationDetails
							actions={
								<>
									<Button className="rounded-full px-8" onClick={openEdit}>
										Edit pharmacy
									</Button>
									<div className="flex items-center gap-2">
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
										<DropdownMenuContent align="start">
											<DropdownMenuItem
												className="text-destructive focus:text-destructive"
												onClick={() => setDeleteOpen(true)}
											>
												Delete pharmacy
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</>
							}
						/>
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
			</div>
		</DashboardLayout>
	)
}
