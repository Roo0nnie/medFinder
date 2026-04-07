"use client"

import { useCallback, useEffect, useState } from "react"

import FileUpload from "@/core/components/ui/file-upload"
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
import {
	Stepper,
	StepperContent,
	StepperDescription,
	StepperIndicator,
	StepperItem,
	StepperList,
	StepperSeparator,
	StepperTitle,
	StepperTrigger,
	type StepperProps,
} from "@/core/components/ui/stepper"
import { Switch } from "@/core/components/ui/switch"
import { Textarea } from "@/core/components/ui/textarea"
import { useToast } from "@/core/components/ui/use-toast"
import {
	uploadPharmacyCertificate,
	uploadPharmacyImage,
	usePharmacyCreateMutation,
	usePharmacyUpdateMutation,
	type Pharmacy,
} from "@/features/pharmacies/api/pharmacies.hooks"

const STEP_ORDER = ["basic", "address", "contact", "upload"] as const
type StepValue = (typeof STEP_ORDER)[number]

const STEPS: { value: StepValue; title: string; description: string }[] = [
	{ value: "basic", title: "Basic", description: "Name and description" },
	{ value: "address", title: "Address", description: "Location details" },
	{ value: "contact", title: "Contact\u00A0&\u00A0social media", description: "Hours, map, and links" },
	{ value: "upload", title: "Upload image", description: "Logo and storefront" },
]

const IMAGE_ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/gif"]

const CERTIFICATE_ACCEPT = [
	"application/pdf",
	"image/jpeg",
	"image/png",
	"image/webp",
]

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
	const [step, setStep] = useState<StepValue>("basic")
	const [form, setForm] = useState<Partial<Pharmacy>>(emptyForm)
	const [pendingLogo, setPendingLogo] = useState<File | null>(null)
	const [pendingOwner, setPendingOwner] = useState<File | null>(null)
	const [pendingCertificate, setPendingCertificate] = useState<File | null>(null)

	useEffect(() => {
		if (open) {
			setStep("basic")
			setPendingLogo(null)
			setPendingOwner(null)
			setPendingCertificate(null)
			setForm({
				...emptyForm,
				...(initial ?? {}),
			})
		}
	}, [open, initial])

	const busy = createMutation.isPending || updateMutation.isPending

	const validateStepKey = useCallback(
		(key: StepValue): boolean => {
			if (key === "basic") {
				if (!(form.name ?? "").trim()) return false
				return true
			}
			if (key === "address") {
				if (!(form.address ?? "").trim()) return false
				if (!(form.city ?? "").trim()) return false
				if (!(form.state ?? "").trim()) return false
				if (!(form.zipCode ?? "").trim()) return false
				return true
			}
			return true
		},
		[form]
	)

	const handleStepValidate: NonNullable<StepperProps["onValidate"]> = useCallback(
		(targetValue, direction) => {
			if (direction === "prev") return true
			const targetIdx = STEP_ORDER.indexOf(targetValue as StepValue)
			if (targetIdx < 0) return true
			const currentIdx = STEP_ORDER.indexOf(step)
			if (targetIdx <= currentIdx) return true
			for (let i = currentIdx; i < targetIdx; i++) {
				const k = STEP_ORDER[i]
				if (k && !validateStepKey(k)) return false
			}
			return true
		},
		[step, validateStepKey]
	)

	const handleNext = () => {
		if (!validateStepKey(step)) return
		const idx = STEP_ORDER.indexOf(step)
		if (idx < STEP_ORDER.length - 1) {
			setStep(STEP_ORDER[idx + 1]!)
		}
	}

	const handleBack = () => {
		if (step === "basic") {
			onOpenChange(false)
			return
		}
		const idx = STEP_ORDER.indexOf(step)
		if (idx > 0) setStep(STEP_ORDER[idx - 1]!)
	}

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
			const certNumber = (form.certificateNumber ?? "").trim()
			if (mode === "create") {
				if (!validateStepKey("basic") || !validateStepKey("address")) return
				if (!pendingCertificate || !certNumber) {
					toast({
						title: "Certificate required",
						description: "Upload a business certificate and enter its certificate number.",
						variant: "destructive",
					})
					return
				}
				const created = await createMutation.mutateAsync(
					buildCreateBody() as Partial<Pharmacy>
				)
				const id = created.id
				await uploadPharmacyCertificate(id, pendingCertificate, certNumber)
				if (pendingLogo) {
					await uploadPharmacyImage(id, "logo", pendingLogo)
				}
				if (pendingOwner) {
					await uploadPharmacyImage(id, "owner", pendingOwner)
				}
			} else {
				if (!pharmacyId) return
				await updateMutation.mutateAsync(buildUpdateBody())
				if (pendingCertificate && certNumber) {
					await uploadPharmacyCertificate(pharmacyId, pendingCertificate, certNumber)
				}
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

	const handleLogoSuccess = async (file: File) => {
		if (mode === "edit" && pharmacyId) {
			try {
				const updated = await uploadPharmacyImage(pharmacyId, "logo", file)
				setForm(f => ({ ...f, logo: updated.logo ?? "" }))
			} catch (e: unknown) {
				const message = e instanceof Error ? e.message : "Upload failed"
				toast({ title: "Logo upload failed", description: message, variant: "destructive" })
			}
		} else {
			setPendingLogo(file)
		}
	}

	const handleOwnerSuccess = async (file: File) => {
		if (mode === "edit" && pharmacyId) {
			try {
				const updated = await uploadPharmacyImage(pharmacyId, "owner", file)
				setForm(f => ({ ...f, ownerImage: updated.ownerImage ?? "" }))
			} catch (e: unknown) {
				const message = e instanceof Error ? e.message : "Upload failed"
				toast({ title: "Image upload failed", description: message, variant: "destructive" })
			}
		} else {
			setPendingOwner(file)
		}
	}

	const handleCertificateSuccess = (file: File) => {
		setPendingCertificate(file)
	}

	const uploadDelay = mode === "create" ? 1800 : 0

	const contentClass =
		"flex flex-col gap-4 rounded-md border border-border/60 bg-card p-4 text-card-foreground shadow-sm"

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl"
				showCloseButton
			>
				<Stepper
					value={step}
					onValueChange={v => setStep(v as StepValue)}
					onValidate={handleStepValidate}
					className="flex min-h-0 w-full flex-1 flex-col gap-0"
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
						<nav aria-label="Progress" className="w-full pt-1">
							<StepperList className="w-full gap-1 sm:gap-2">
								{STEPS.map(s => (
									<StepperItem key={s.value} value={s.value}>
										<StepperTrigger className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
											<StepperIndicator />
											<span className="hidden min-w-0 flex-1 flex-col gap-0.5 text-left sm:flex">
												<StepperTitle className="text-xs leading-tight sm:text-sm">
													{s.title}
												</StepperTitle>
												<StepperDescription className="line-clamp-2 text-[10px] sm:text-xs">
													{s.description}
												</StepperDescription>
											</span>
										</StepperTrigger>
										<StepperSeparator />
									</StepperItem>
								))}
							</StepperList>
						</nav>
					</div>

					<div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
						<StepperContent value="basic" className={contentClass}>
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
						</StepperContent>

						<StepperContent value="address" className={contentClass}>
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
						</StepperContent>

						<StepperContent value="contact" className={contentClass}>
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
						</StepperContent>

						<StepperContent value="upload" className={contentClass}>
							<div className="space-y-8">
								<div className="space-y-3">
									<div>
										<p className="font-medium text-sm">Business certificate (required)</p>
										<p className="text-muted-foreground text-xs">
											Upload PDF/JPG/PNG/WebP (max 10 MB). Status will be reviewed by admin.
										</p>
									</div>
									<div className="space-y-2">
										<Label htmlFor="stepper-certificate-number">Certificate number *</Label>
										<Input
											id="stepper-certificate-number"
											value={form.certificateNumber ?? ""}
											onChange={e =>
												setForm(f => ({ ...f, certificateNumber: e.target.value }))
											}
											placeholder="Enter business certificate number"
											disabled={busy}
										/>
									</div>
									<div className="space-y-2">
										<Label>Certificate file *</Label>
										<div
											className={busy ? "pointer-events-none opacity-60" : undefined}
											aria-busy={busy}
										>
											<FileUpload
												acceptedFileTypes={[...CERTIFICATE_ACCEPT]}
												maxFileSize={10 * 1024 * 1024}
												uploadDelay={0}
												onUploadSuccess={handleCertificateSuccess}
												className="max-w-none"
											/>
										</div>
										{form.certificateStatus && (
											<p className="text-muted-foreground text-xs">
												Current status:{" "}
												<span className="font-medium uppercase">{form.certificateStatus}</span>
												{form.certificateReviewNote
													? ` - ${form.certificateReviewNote}`
													: ""}
											</p>
										)}
										{pendingCertificate && (
											<p className="text-muted-foreground text-xs">
												Selected: {pendingCertificate.name}
											</p>
										)}
									</div>
								</div>

								<div className="space-y-3">
									<div>
										<p className="font-medium text-sm">Logo</p>
										<p className="text-muted-foreground text-xs">
											{mode === "create" && !pharmacyId
												? "Images upload after you create the pharmacy. You can also paste a URL below."
												: "PNG, JPG, WebP, or GIF up to 5 MB."}
										</p>
									</div>
									<FileUpload
										acceptedFileTypes={IMAGE_ACCEPT}
										uploadDelay={uploadDelay}
										onUploadSuccess={handleLogoSuccess}
										className="max-w-none"
									/>
									<div className="space-y-1">
										<Label htmlFor="stepper-logo-url" className="text-muted-foreground text-xs font-normal">
											Or image URL
										</Label>
										<Input
											id="stepper-logo-url"
											type="url"
											placeholder="https://…"
											value={form.logo ?? ""}
											onChange={e => setForm(f => ({ ...f, logo: e.target.value }))}
											disabled={busy}
										/>
									</div>
								</div>

								<div className="space-y-3">
									<div>
										<p className="font-medium text-sm">Storefront / owner image</p>
										<p className="text-muted-foreground text-xs">
											{mode === "create" && !pharmacyId
												? "Shown on your public storefront."
												: "PNG, JPG, WebP, or GIF up to 5 MB."}
										</p>
									</div>
									<FileUpload
										acceptedFileTypes={IMAGE_ACCEPT}
										uploadDelay={uploadDelay}
										onUploadSuccess={handleOwnerSuccess}
										className="max-w-none"
									/>
									<div className="space-y-1">
										<Label htmlFor="stepper-owner-url" className="text-muted-foreground text-xs font-normal">
											Or image URL
										</Label>
										<Input
											id="stepper-owner-url"
											type="url"
											placeholder="https://…"
											value={form.ownerImage ?? ""}
											onChange={e => setForm(f => ({ ...f, ownerImage: e.target.value }))}
											disabled={busy}
										/>
									</div>
								</div>
							</div>
						</StepperContent>
					</div>
				</Stepper>

				<div className="border-border/50 bg-muted/30 flex flex-col-reverse gap-2 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
					<Button type="button" variant="outline" onClick={handleBack} disabled={busy}>
						{step === "basic" ? "Cancel" : "Back"}
					</Button>
					<div className="flex gap-2">
						{step !== "upload" ? (
							<Button type="button" onClick={handleNext} disabled={busy || !validateStepKey(step)}>
								Next
							</Button>
						) : (
							<Button
								type="button"
								onClick={() => void submit()}
								disabled={busy || !validateStepKey("basic") || !validateStepKey("address")}
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
