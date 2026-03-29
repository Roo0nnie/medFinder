"use client"

import { useEffect, useState } from "react"

import { Button } from "@/core/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/core/components/ui/dialog"
import { Input } from "@/core/components/ui/input"
import { Label } from "@/core/components/ui/label"
import { Switch } from "@/core/components/ui/switch"
import { Textarea } from "@/core/components/ui/textarea"
import { useToast } from "@/core/components/ui/use-toast"
import { cn } from "@/core/lib/utils"
import {
	uploadPharmacyImage,
	usePharmacyCreateMutation,
	usePharmacyUpdateMutation,
	type Pharmacy,
} from "@/features/pharmacies/api/pharmacies.hooks"
import { PharmacyImageUploadField } from "@/features/pharmacies/components/pharmacy-image-upload-field"

const STEPS = ["Basics", "Address", "Contact & media"] as const

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
	ownerImage: "",
	googleMapEmbed: "",
	socialLinks: "",
	isActive: true,
}

export type EditPharmacyStepperDialogProps = {
	open: boolean
	onOpenChange: (open: boolean) => void
	mode: "create" | "edit"
	pharmacyId?: string
	initial: Partial<Pharmacy> | null
	onSaved: () => void
}

export function EditPharmacyStepperDialog({
	open,
	onOpenChange,
	mode,
	pharmacyId,
	initial,
	onSaved,
}: EditPharmacyStepperDialogProps) {
	const { toast } = useToast()
	const createMutation = usePharmacyCreateMutation()
	const updateMutation = usePharmacyUpdateMutation()
	const [step, setStep] = useState(0)
	const [form, setForm] = useState<Partial<Pharmacy>>(emptyForm)
	const [pendingLogo, setPendingLogo] = useState<File | null>(null)
	const [pendingOwner, setPendingOwner] = useState<File | null>(null)

	useEffect(() => {
		if (open) {
			setStep(0)
			setPendingLogo(null)
			setPendingOwner(null)
			setForm({
				...emptyForm,
				...(initial ?? {}),
			})
		}
	}, [open, initial])

	const busy = createMutation.isPending || updateMutation.isPending

	const validateStep = (i: number): boolean => {
		if (i === 0) {
			if (!(form.name ?? "").trim()) return false
			return true
		}
		if (i === 1) {
			if (!(form.address ?? "").trim()) return false
			if (!(form.city ?? "").trim()) return false
			if (!(form.state ?? "").trim()) return false
			if (!(form.zipCode ?? "").trim()) return false
			return true
		}
		return true
	}

	const handleNext = () => {
		if (!validateStep(step)) return
		setStep(s => Math.min(s + 1, STEPS.length - 1))
	}

	const handleBack = () => setStep(s => Math.max(s - 1, 0))

	const buildCreateBody = () => ({
		name: form.name!.trim(),
		description: form.description?.trim() || undefined,
		address: form.address!.trim(),
		city: form.city!.trim(),
		state: form.state!.trim(),
		zipCode: form.zipCode!.trim(),
		country: form.country?.trim() || "US",
		latitude: form.latitude,
		longitude: form.longitude,
		phone: form.phone?.trim() || undefined,
		email: form.email?.trim() || undefined,
		website: form.website?.trim() || undefined,
		operatingHours: form.operatingHours?.trim() || undefined,
		logo: form.logo?.trim() || undefined,
		ownerImage: form.ownerImage?.trim() || undefined,
		googleMapEmbed: form.googleMapEmbed?.trim() || undefined,
		socialLinks: form.socialLinks?.trim() || undefined,
	})

	const buildUpdateBody = (): Partial<Pharmacy> & { id: string } => ({
		id: pharmacyId!,
		name: form.name,
		description: form.description,
		address: form.address,
		city: form.city,
		state: form.state,
		zipCode: form.zipCode,
		country: form.country,
		latitude: form.latitude,
		longitude: form.longitude,
		phone: form.phone,
		email: form.email,
		website: form.website,
		operatingHours: form.operatingHours,
		logo: form.logo,
		ownerImage: form.ownerImage,
		googleMapEmbed: form.googleMapEmbed,
		socialLinks: form.socialLinks,
		isActive: form.isActive,
	})

	const submit = async () => {
		try {
			if (mode === "create") {
				if (!validateStep(0) || !validateStep(1)) return
				const created = await createMutation.mutateAsync(
					buildCreateBody() as Partial<Pharmacy>
				)
				const id = created.id
				if (pendingLogo) {
					await uploadPharmacyImage(id, "logo", pendingLogo)
				}
				if (pendingOwner) {
					await uploadPharmacyImage(id, "owner", pendingOwner)
				}
			} else {
				if (!pharmacyId) return
				await updateMutation.mutateAsync(buildUpdateBody())
			}
			onSaved()
			onOpenChange(false)
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : "Something went wrong"
			toast({
				title: mode === "create" ? "Could not create pharmacy" : "Could not save changes",
				description: message,
				variant: "destructive",
			})
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
				showCloseButton
			>
				<div className="border-border/50 space-y-3 border-b p-4 sm:p-6">
					<DialogHeader>
						<DialogTitle className="text-base sm:text-lg">
							{mode === "create" ? "Set up your pharmacy" : "Edit pharmacy"}
						</DialogTitle>
						<DialogDescription>
							{mode === "create"
								? "Complete each step to publish your storefront."
								: "Update your storefront details."}
						</DialogDescription>
					</DialogHeader>
					<nav aria-label="Progress" className="flex gap-2 pt-1">
						{STEPS.map((label, i) => (
							<div key={label} className="flex flex-1 items-center gap-2">
								<div
									className={cn(
										"flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
										i === step
											? "bg-foreground text-background"
											: i < step
												? "bg-muted text-muted-foreground"
												: "border-border bg-background text-muted-foreground border"
									)}
								>
									{i + 1}
								</div>
								<span
									className={cn(
										"hidden text-xs font-medium sm:inline",
										i === step ? "text-foreground" : "text-muted-foreground"
									)}
								>
									{label}
								</span>
							</div>
						))}
					</nav>
				</div>

				<div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
					{step === 0 && (
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="stepper-name">Name *</Label>
								<Input
									id="stepper-name"
									value={form.name ?? ""}
									onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
									placeholder="Pharmacy name"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="stepper-desc">Description</Label>
								<Textarea
									id="stepper-desc"
									rows={4}
									value={form.description ?? ""}
									onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
									placeholder="Short description customers will see"
								/>
							</div>
							{mode === "edit" && (
								<div className="flex items-center gap-2 pt-1">
									<Switch
										id="stepper-active"
										checked={form.isActive ?? true}
										onCheckedChange={checked => setForm(f => ({ ...f, isActive: checked }))}
									/>
									<Label htmlFor="stepper-active" className="cursor-pointer font-normal">
										Visible to customers (active)
									</Label>
								</div>
							)}
						</div>
					)}

					{step === 1 && (
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2 sm:col-span-2">
								<Label htmlFor="stepper-address">Street address *</Label>
								<Input
									id="stepper-address"
									value={form.address ?? ""}
									onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="stepper-city">City *</Label>
								<Input
									id="stepper-city"
									value={form.city ?? ""}
									onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="stepper-state">State *</Label>
								<Input
									id="stepper-state"
									value={form.state ?? ""}
									onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="stepper-zip">ZIP / Postal code *</Label>
								<Input
									id="stepper-zip"
									value={form.zipCode ?? ""}
									onChange={e => setForm(f => ({ ...f, zipCode: e.target.value }))}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="stepper-country">Country</Label>
								<Input
									id="stepper-country"
									value={form.country ?? "US"}
									onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="stepper-lat">Latitude</Label>
								<Input
									id="stepper-lat"
									type="number"
									step="any"
									value={form.latitude ?? ""}
									onChange={e => {
										const v = e.target.value
										setForm(f => ({ ...f, latitude: v === "" ? undefined : Number(v) }))
									}}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="stepper-lng">Longitude</Label>
								<Input
									id="stepper-lng"
									type="number"
									step="any"
									value={form.longitude ?? ""}
									onChange={e => {
										const v = e.target.value
										setForm(f => ({ ...f, longitude: v === "" ? undefined : Number(v) }))
									}}
								/>
							</div>
						</div>
					)}

					{step === 2 && (
						<div className="space-y-4">
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="stepper-phone">Phone</Label>
									<Input
										id="stepper-phone"
										type="tel"
										value={form.phone ?? ""}
										onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="stepper-email">Email</Label>
									<Input
										id="stepper-email"
										type="email"
										value={form.email ?? ""}
										onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
									/>
								</div>
							</div>
							<div className="space-y-2">
								<Label htmlFor="stepper-web">Website</Label>
								<Input
									id="stepper-web"
									type="url"
									value={form.website ?? ""}
									onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="stepper-hours">Operating hours</Label>
								<Input
									id="stepper-hours"
									value={form.operatingHours ?? ""}
									onChange={e => setForm(f => ({ ...f, operatingHours: e.target.value }))}
								/>
							</div>
							<PharmacyImageUploadField
								label="Logo"
								kind="logo"
								mode={mode}
								pharmacyId={pharmacyId}
								value={form.logo ?? ""}
								onUrlChange={url => setForm(f => ({ ...f, logo: url }))}
								pendingFile={pendingLogo}
								onPendingFileChange={setPendingLogo}
								disabled={busy}
							/>
							<PharmacyImageUploadField
								label="Storefront / owner image"
								kind="owner"
								mode={mode}
								pharmacyId={pharmacyId}
								value={form.ownerImage ?? ""}
								onUrlChange={url => setForm(f => ({ ...f, ownerImage: url }))}
								pendingFile={pendingOwner}
								onPendingFileChange={setPendingOwner}
								disabled={busy}
							/>
							<div className="space-y-2">
								<Label htmlFor="stepper-map">Google Map embed URL</Label>
								<Input
									id="stepper-map"
									value={form.googleMapEmbed ?? ""}
									onChange={e => setForm(f => ({ ...f, googleMapEmbed: e.target.value }))}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="stepper-social">Social links</Label>
								<Input
									id="stepper-social"
									value={form.socialLinks ?? ""}
									onChange={e => setForm(f => ({ ...f, socialLinks: e.target.value }))}
								/>
							</div>
						</div>
					)}
				</div>

				<div className="border-border/50 bg-muted/30 flex flex-col-reverse gap-2 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
					<Button
						type="button"
						variant="outline"
						onClick={() => (step === 0 ? onOpenChange(false) : handleBack())}
						disabled={busy}
					>
						{step === 0 ? "Cancel" : "Back"}
					</Button>
					<div className="flex gap-2">
						{step < STEPS.length - 1 ? (
							<Button type="button" onClick={handleNext} disabled={busy || !validateStep(step)}>
								Next
							</Button>
						) : (
							<Button
								type="button"
								onClick={() => void submit()}
								disabled={busy || !validateStep(0) || !validateStep(1)}
							>
								{mode === "create" ? "Create pharmacy" : "Save changes"}
							</Button>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}
