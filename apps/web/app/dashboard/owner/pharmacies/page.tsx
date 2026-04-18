"use client"

import { useEffect, useRef, useState } from "react"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu"
import { Separator } from "@/core/components/ui/separator"
import { Skeleton } from "@/core/components/ui/skeleton"
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

function DetailItem({
	label,
	children,
	className,
}: {
	label: string
	children: React.ReactNode
	className?: string
}) {
	return (
		<div className={className}>
			<dt className="text-muted-foreground text-xs font-medium">{label}</dt>
			<dd className="text-foreground mt-1 text-sm wrap-break-word">{children}</dd>
		</div>
	)
}

function MonoValue({ children }: { children: React.ReactNode }) {
	return <span className="font-mono text-xs leading-relaxed break-all text-foreground/90">{children}</span>
}

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

	const loadErrorNotified = useRef(false)
	useEffect(() => {
		if (isError) {
			if (!loadErrorNotified.current) {
				loadErrorNotified.current = true
				toast({
					title: "Failed to load pharmacies",
					description: "Check API base URL and session, then try again.",
					variant: "destructive",
				})
			}
		} else {
			loadErrorNotified.current = false
		}
	}, [isError, toast])

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
					<div className="min-w-0 space-y-1">
						<h1 className="text-3xl font-bold tracking-tight text-foreground">My pharmacy</h1>
						<p className="text-muted-foreground mt-2 text-sm">
							Preview how customers see your storefront and keep details up to date.
						</p>
						{pharmacy ? (
							<p className="text-foreground mt-2 truncate text-lg font-semibold tracking-tight">
								{pharmacy.name}
							</p>
						) : null}
					</div>
				</div>

				{isLoading && (
					<div className="space-y-6" aria-busy="true" aria-label="Loading pharmacy">
						<Skeleton className="h-28 w-full rounded-xl" />
						<Skeleton className="h-96 w-full rounded-xl" />
					</div>
				)}

				{isError && (
					<Card className="border-destructive/30">
						<CardContent className="flex flex-wrap items-center gap-3 pt-6">
							<p className="text-muted-foreground text-sm">We couldn&apos;t load your pharmacy.</p>
							<Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
								Retry
							</Button>
						</CardContent>
					</Card>
				)}

				{!isLoading && !isError && !pharmacy && (
					<Card className="border-dashed">
						<CardContent className="flex flex-col items-center gap-4 p-8 text-center sm:p-12">
							<div className="max-w-md space-y-2">
								<p className="text-foreground text-sm font-medium">No pharmacy yet</p>
								<p className="text-muted-foreground text-sm">
									Set up your pharmacy profile. You can add one location per account.
								</p>
							</div>
							<Button className="rounded-full px-8" onClick={openCreate}>
								Set up your pharmacy
							</Button>
						</CardContent>
					</Card>
				)}

				{pharmacy && (
					<div className="animate-in fade-in slide-in-from-bottom-1 space-y-6 duration-300">
						<Card>
							<CardHeader className="border-border border-b">
								<CardTitle className="text-base">Verification</CardTitle>
								<CardDescription>
									Certificate review status for operating on the platform.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3 pt-6">
								<div className="flex flex-wrap items-center gap-2">
									<span className="text-muted-foreground text-sm">Status</span>
									<span className="text-foreground rounded-md bg-muted px-2 py-0.5 text-xs font-semibold uppercase tracking-wide">
										{pharmacy.certificateStatus ?? "pending"}
									</span>
								</div>
								{pharmacy.certificateReviewNote ? (
									<p className="text-muted-foreground text-sm leading-relaxed">
										<span className="font-medium text-foreground">Review note: </span>
										{pharmacy.certificateReviewNote}
									</p>
								) : null}
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="border-border space-y-4 border-b pb-6">
								<div className="space-y-1">
									<CardTitle className="text-base">Pharmacy profile</CardTitle>
									<CardDescription>
										Manage visibility, storefront link, and detailed fields below.
									</CardDescription>
								</div>
								<div className="flex flex-wrap items-stretch gap-2 sm:items-center">
									<Button variant="secondary" className="rounded-full px-6">
										<Link href={`/pharmacy/${pharmacy.id}` as Route}>View My Pharmacy</Link>
									</Button>
									<Button className="rounded-full px-6" onClick={openEdit}>
										Edit pharmacy
									</Button>
									<div className="border-border bg-muted/30 flex min-h-10 flex-1 items-center gap-2 rounded-full border px-3 py-2 sm:flex-none sm:shrink-0">
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
											<Button variant="outline" size="sm" className="rounded-full">
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
							</CardHeader>

							<CardContent className="space-y-8 pt-6">
								<section className="space-y-3">
									<h2 className="text-foreground text-sm font-semibold">Storefront &amp; visibility</h2>
									<dl className="grid gap-4 sm:grid-cols-2">
										<DetailItem label="Name">{pharmacy.name}</DetailItem>
										<DetailItem label="Description" className="sm:col-span-2">
											{pharmacy.description?.trim() ? (
												<span className="max-h-48 overflow-y-auto whitespace-pre-line">
													{pharmacy.description}
												</span>
											) : (
												"—"
											)}
										</DetailItem>
										<DetailItem label="Operating hours" className="sm:col-span-2">
											{pharmacy.operatingHours?.trim() ? (
												<span className="max-h-40 overflow-y-auto whitespace-pre-line">
													{pharmacy.operatingHours}
												</span>
											) : (
												"—"
											)}
										</DetailItem>
										<DetailItem label="Website" className="sm:col-span-2">
											{pharmacy.website?.trim() ? (
												<MonoValue>{pharmacy.website}</MonoValue>
											) : (
												"—"
											)}
										</DetailItem>
										<DetailItem label="Visible to customers">{pharmacy.isActive ? "Yes" : "No"}</DetailItem>
									</dl>
								</section>

								<Separator />

								<section className="space-y-3">
									<h2 className="text-foreground text-sm font-semibold">Contact &amp; location</h2>
									<dl className="grid gap-4 sm:grid-cols-2">
										<DetailItem label="Address (formatted)" className="sm:col-span-2">
											{addressLine.trim().length > 0 ? addressLine : "—"}
										</DetailItem>
										<DetailItem label="Street">{pharmacy.address ?? "—"}</DetailItem>
										<DetailItem label="City">{pharmacy.city ?? "—"}</DetailItem>
										<DetailItem label="State">{pharmacy.state ?? "—"}</DetailItem>
										<DetailItem label="Zip code">{pharmacy.zipCode ?? "—"}</DetailItem>
										<DetailItem label="Country">{pharmacy.country ?? "—"}</DetailItem>
										<DetailItem label="Phone">{pharmacy.phone ?? "—"}</DetailItem>
										<DetailItem label="Email">{pharmacy.email ?? "—"}</DetailItem>
										<DetailItem label="Latitude">
											{pharmacy.latitude != null ? String(pharmacy.latitude) : "—"}
										</DetailItem>
										<DetailItem label="Longitude">
											{pharmacy.longitude != null ? String(pharmacy.longitude) : "—"}
										</DetailItem>
										<DetailItem label="Google map embed" className="sm:col-span-2">
											{pharmacy.googleMapEmbed?.trim() ? (
												<MonoValue>{pharmacy.googleMapEmbed}</MonoValue>
											) : (
												"—"
											)}
										</DetailItem>
									</dl>
								</section>

								<Separator />

								<section className="space-y-3">
									<h2 className="text-foreground text-sm font-semibold">Certificate &amp; compliance</h2>
									<dl className="grid gap-4 sm:grid-cols-2">
										<DetailItem label="Certificate number">{pharmacy.certificateNumber ?? "—"}</DetailItem>
										<DetailItem label="Certificate status">
											<span className="uppercase">{pharmacy.certificateStatus ?? "—"}</span>
										</DetailItem>
										<DetailItem label="Certificate file" className="sm:col-span-2">
											{pharmacy.certificateFileUrl ? (
												<a
													href={pharmacy.certificateFileUrl}
													target="_blank"
													rel="noreferrer"
													className="text-primary font-medium underline-offset-4 hover:underline"
												>
													View uploaded certificate
												</a>
											) : (
												"—"
											)}
										</DetailItem>
									</dl>
								</section>

								<Separator />

								<section className="space-y-3">
									<h2 className="text-foreground text-sm font-semibold">Media &amp; links</h2>
									<dl className="grid gap-4 sm:grid-cols-2">
										<DetailItem label="Social links" className="sm:col-span-2">
											{pharmacy.socialLinks?.trim() ? (
												<MonoValue>{pharmacy.socialLinks}</MonoValue>
											) : (
												"—"
											)}
										</DetailItem>
										<DetailItem label="Logo" className="sm:col-span-2">
											{pharmacy.logo?.trim() ? <MonoValue>{pharmacy.logo}</MonoValue> : "—"}
										</DetailItem>
										<DetailItem label="Owner image" className="sm:col-span-2">
											{pharmacy.ownerImage?.trim() ? (
												<MonoValue>{pharmacy.ownerImage}</MonoValue>
											) : (
												"—"
											)}
										</DetailItem>
									</dl>
								</section>

								<Separator />

								<section className="space-y-3">
									<h2 className="text-foreground text-sm font-semibold">System / metadata</h2>
									<dl className="grid gap-4 sm:grid-cols-2">
										<DetailItem label="Created at">{pharmacy.createdAt ?? "—"}</DetailItem>
										<DetailItem label="Updated at">{pharmacy.updatedAt ?? "—"}</DetailItem>
									</dl>
								</section>
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
