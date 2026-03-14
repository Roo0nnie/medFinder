"use client"

import { useEffect, useState } from "react"

import { Button } from "@/core/components/ui/button"
import { Card, CardContent } from "@/core/components/ui/card"
import { Input } from "@/core/components/ui/input"
import { Label } from "@/core/components/ui/label"
import { Switch } from "@/core/components/ui/switch"
import { Textarea } from "@/core/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/core/components/ui/table"
import { useToast } from "../../../../core/components/ui/use-toast"
import { DashboardLayout } from "../../../../features/dashboard/components/DashboardLayout"
import {
	useMyPharmaciesQuery,
	usePharmacyCreateMutation,
	usePharmacyDeleteMutation,
	usePharmacyUpdateMutation,
	type Pharmacy,
} from "@/features/pharmacies/api/pharmacies.hooks"

const emptyForm: Partial<Pharmacy> = {
	name: "",
	description: "",
	address: "",
	city: "",
	state: "",
	zipCode: "",
	country: "US",
	latitude: undefined,
	longitude: undefined,
	phone: "",
	email: "",
	website: "",
	operatingHours: "",
	logo: "",
	googleMapEmbed: "",
	socialLinks: "",
	isActive: true,
}

export default function OwnerPharmaciesPage() {
	const { toast } = useToast()
	const { data: pharmacies, isLoading, isError } = useMyPharmaciesQuery()
	const createMutation = usePharmacyCreateMutation()
	const updateMutation = usePharmacyUpdateMutation()
	const deleteMutation = usePharmacyDeleteMutation()

	const [editing, setEditing] = useState<Pharmacy | null>(null)
	const [form, setForm] = useState<Partial<Pharmacy>>(emptyForm)

	useEffect(() => {
		if (editing) {
			setForm({
				...emptyForm,
				...editing,
			})
		} else {
			setForm({ ...emptyForm })
		}
	}, [editing])

	const submit = async () => {
		try {
			if (editing) {
				await updateMutation.mutateAsync({ id: editing.id, ...form })
				toast({ title: "Pharmacy updated" })
			} else {
				await createMutation.mutateAsync(form)
				toast({ title: "Pharmacy created" })
			}
			setEditing(null)
		} catch (e: any) {
			toast({ title: "Save failed", description: e.message, variant: "destructive" })
		}
	}

	const handleDelete = async (id: string) => {
		try {
			await deleteMutation.mutateAsync(id)
			toast({ title: "Pharmacy deleted" })
		} catch (e: any) {
			toast({ title: "Delete failed", description: e.message, variant: "destructive" })
		}
	}

	return (
		<DashboardLayout role="owner">
			<div className="space-y-6">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-foreground">My Pharmacies</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						Create, update, and deactivate pharmacies you own.
					</p>
				</div>

				<Card>
					<CardContent className="p-4 sm:p-6">
						<div className="flex items-center justify-between">
							<h2 className="text-lg font-semibold">Locations</h2>
							{(pharmacies?.length ?? 0) === 0 && (
								<Button onClick={() => setEditing(null)}>
									Add pharmacy
								</Button>
							)}
						</div>
						{isLoading && <p className="text-sm text-muted-foreground mt-3">Loading...</p>}
						{isError && (
							<p className="text-sm text-destructive mt-3">
								Failed to load pharmacies. Check API base URL and session.
							</p>
						)}
						<div className="mt-4 overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Name</TableHead>
										<TableHead>City</TableHead>
										<TableHead>State</TableHead>
										<TableHead>Phone</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{pharmacies?.map(ph => (
										<TableRow key={ph.id}>
											<TableCell className="font-semibold">{ph.name}</TableCell>
											<TableCell>{ph.city}</TableCell>
											<TableCell>{ph.state}</TableCell>
											<TableCell>{ph.phone || "—"}</TableCell>
											<TableCell className="flex justify-end gap-2">
												<Button size="sm" variant="outline" onClick={() => setEditing(ph)}>
													Edit
												</Button>
												<Button
													size="sm"
													variant="ghost"
													className="text-destructive"
													onClick={() => handleDelete(ph.id)}
												>
													Delete
												</Button>
											</TableCell>
										</TableRow>
									))}
									{!isLoading && (pharmacies?.length ?? 0) === 0 && (
										<TableRow>
											<TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
												No pharmacies yet. Add one above.
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>

				{((pharmacies?.length ?? 0) === 0 || editing) && (
					<Card>
					<CardContent className="p-4 sm:p-6 space-y-6">
						<h2 className="text-lg font-semibold">{editing ? "Edit pharmacy" : "New pharmacy"}</h2>

						{/* Basic info */}
						<div className="space-y-3">
							<h3 className="text-sm font-medium text-muted-foreground">Basic information</h3>
							<div className="grid gap-3 sm:grid-cols-1">
								<div className="space-y-2">
									<Label htmlFor="pharmacy-name">Name *</Label>
									<Input
										id="pharmacy-name"
										placeholder="Pharmacy name"
										value={form.name ?? ""}
										onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="pharmacy-description">Description</Label>
									<Textarea
										id="pharmacy-description"
										placeholder="Short description of your pharmacy"
										rows={3}
										value={form.description ?? ""}
										onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
									/>
								</div>
							</div>
						</div>

						{/* Address */}
						<div className="space-y-3">
							<h3 className="text-sm font-medium text-muted-foreground">Address</h3>
							<div className="grid gap-3 sm:grid-cols-2">
								<div className="space-y-2 sm:col-span-2">
									<Label htmlFor="pharmacy-address">Street address *</Label>
									<Input
										id="pharmacy-address"
										placeholder="Street address"
										value={form.address ?? ""}
										onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="pharmacy-city">City *</Label>
									<Input
										id="pharmacy-city"
										placeholder="City"
										value={form.city ?? ""}
										onChange={e => setForm(prev => ({ ...prev, city: e.target.value }))}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="pharmacy-state">State *</Label>
									<Input
										id="pharmacy-state"
										placeholder="State / Province"
										value={form.state ?? ""}
										onChange={e => setForm(prev => ({ ...prev, state: e.target.value }))}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="pharmacy-zip">ZIP / Postal code *</Label>
									<Input
										id="pharmacy-zip"
										placeholder="ZIP code"
										value={form.zipCode ?? ""}
										onChange={e => setForm(prev => ({ ...prev, zipCode: e.target.value }))}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="pharmacy-country">Country</Label>
									<Input
										id="pharmacy-country"
										placeholder="Country"
										value={form.country ?? "US"}
										onChange={e => setForm(prev => ({ ...prev, country: e.target.value }))}
									/>
								</div>
							</div>
						</div>

						{/* Coordinates (for map display) */}
						<div className="space-y-3">
							<h3 className="text-sm font-medium text-muted-foreground">Map coordinates (optional)</h3>
							<div className="grid gap-3 sm:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="pharmacy-latitude">Latitude</Label>
									<Input
										id="pharmacy-latitude"
										type="number"
										step="any"
										placeholder="e.g. 14.5995"
										value={form.latitude ?? ""}
										onChange={e => {
											const v = e.target.value
											setForm(prev => ({ ...prev, latitude: v === "" ? undefined : Number(v) }))
										}}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="pharmacy-longitude">Longitude</Label>
									<Input
										id="pharmacy-longitude"
										type="number"
										step="any"
										placeholder="e.g. 120.9842"
										value={form.longitude ?? ""}
										onChange={e => {
											const v = e.target.value
											setForm(prev => ({ ...prev, longitude: v === "" ? undefined : Number(v) }))
										}}
									/>
								</div>
							</div>
						</div>

						{/* Contact */}
						<div className="space-y-3">
							<h3 className="text-sm font-medium text-muted-foreground">Contact</h3>
							<div className="grid gap-3 sm:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="pharmacy-phone">Phone</Label>
									<Input
										id="pharmacy-phone"
										type="tel"
										placeholder="Phone number"
										value={form.phone ?? ""}
										onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="pharmacy-email">Email</Label>
									<Input
										id="pharmacy-email"
										type="email"
										placeholder="Email"
										value={form.email ?? ""}
										onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
									/>
								</div>
								<div className="space-y-2 sm:col-span-2">
									<Label htmlFor="pharmacy-website">Website</Label>
									<Input
										id="pharmacy-website"
										type="url"
										placeholder="https://..."
										value={form.website ?? ""}
										onChange={e => setForm(prev => ({ ...prev, website: e.target.value }))}
									/>
								</div>
							</div>
						</div>

						{/* Operating hours */}
						<div className="space-y-3">
							<h3 className="text-sm font-medium text-muted-foreground">Operating hours</h3>
							<div className="space-y-2">
								<Label htmlFor="pharmacy-hours">Hours (e.g. Mon–Sat 8AM–6PM)</Label>
								<Input
									id="pharmacy-hours"
									placeholder="Mon–Sat 8:00 AM – 6:00 PM"
									value={form.operatingHours ?? ""}
									onChange={e => setForm(prev => ({ ...prev, operatingHours: e.target.value }))}
								/>
							</div>
						</div>

						{/* Media & links */}
						<div className="space-y-3">
							<h3 className="text-sm font-medium text-muted-foreground">Media & links</h3>
							<div className="grid gap-3 sm:grid-cols-1">
								<div className="space-y-2">
									<Label htmlFor="pharmacy-logo">Logo URL</Label>
									<Input
										id="pharmacy-logo"
										type="url"
										placeholder="https://..."
										value={form.logo ?? ""}
										onChange={e => setForm(prev => ({ ...prev, logo: e.target.value }))}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="pharmacy-map">Google Map embed URL or iframe src</Label>
									<Input
										id="pharmacy-map"
										placeholder="https://www.google.com/maps/embed?..."
										value={form.googleMapEmbed ?? ""}
										onChange={e => setForm(prev => ({ ...prev, googleMapEmbed: e.target.value }))}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="pharmacy-social">Social links (JSON or comma-separated URLs)</Label>
									<Input
										id="pharmacy-social"
										placeholder="https://facebook.com/..., https://twitter.com/..."
										value={form.socialLinks ?? ""}
										onChange={e => setForm(prev => ({ ...prev, socialLinks: e.target.value }))}
									/>
								</div>
							</div>
						</div>

						{/* Edit only: active toggle */}
						{editing && (
							<div className="flex items-center gap-2">
								<Switch
									id="pharmacy-active"
									checked={form.isActive ?? true}
									onCheckedChange={checked => setForm(prev => ({ ...prev, isActive: checked }))}
								/>
								<Label htmlFor="pharmacy-active" className="font-normal cursor-pointer">
									Pharmacy is active (visible to customers)
								</Label>
							</div>
						)}

						<div className="flex gap-2 justify-end pt-2">
							<Button variant="outline" onClick={() => setEditing(null)}>
								Cancel
							</Button>
							<Button onClick={submit} disabled={createMutation.isPending || updateMutation.isPending}>
								{editing ? "Save changes" : "Create pharmacy"}
							</Button>
						</div>
					</CardContent>
				</Card>
				)}
			</div>
		</DashboardLayout>
	)
}
