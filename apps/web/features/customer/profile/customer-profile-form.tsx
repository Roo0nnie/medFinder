"use client"

import { useEffect, useId, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Eye, EyeOff, ImageIcon, Loader2, Upload } from "lucide-react"

import { authClient } from "@/services/better-auth/auth-client"
import { updateUser } from "@/features/users/api/users.api"
import { sessionKeys } from "@/features/auth/api/session.hooks"

import { Avatar, AvatarFallback, AvatarImage } from "@/core/components/ui/avatar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/core/components/ui/card"
import { Button } from "@/core/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/core/components/ui/field"
import { Input } from "@/core/components/ui/input"
import { Spinner } from "@/core/components/ui/spinner"
import { Checkbox } from "@/core/components/ui/checkbox"
import { Label } from "@/core/components/ui/label"
import { useToast } from "@/core/components/ui/use-toast"

type CustomerUser = {
	id: string
	email?: string | null
	firstName?: string | null
	lastName?: string | null
	middleName?: string | null
	image?: string | null
	profileImageUrl?: string | null
	role?: string | null
}

const MAX_PROFILE_IMAGE_BYTES = 1 * 1024 * 1024
const ACCEPTED_PROFILE_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const

function initialsFromUser(user: CustomerUser): string {
	const first = (user.firstName ?? "").trim()
	const last = (user.lastName ?? "").trim()
	const chars = `${first?.[0] ?? ""}${last?.[0] ?? ""}`.trim()
	return chars ? chars.toUpperCase() : "U"
}

function passwordStrengthLabel(password: string): { label: string; tone: "muted" | "warn" | "good" } {
	const p = password ?? ""
	if (!p) return { label: "Use 12+ characters for a strong password.", tone: "muted" }

	const lengthScore = p.length >= 16 ? 2 : p.length >= 12 ? 1 : 0
	const varietyScore =
		(Number(/[a-z]/.test(p)) +
			Number(/[A-Z]/.test(p)) +
			Number(/[0-9]/.test(p)) +
			Number(/[^a-zA-Z0-9]/.test(p))) >=
		3
			? 1
			: 0

	const score = lengthScore + varietyScore
	if (score <= 0) return { label: "Too short. Aim for 12+ characters.", tone: "warn" }
	if (score === 1) return { label: "Decent. Consider a longer passphrase.", tone: "muted" }
	return { label: "Strong. Great choice.", tone: "good" }
}

async function fileToDataUrl(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onerror = () => reject(new Error("Could not read file"))
		reader.onload = () => resolve(String(reader.result ?? ""))
		reader.readAsDataURL(file)
	})
}

export function CustomerProfileForm({ user }: { user: CustomerUser }) {
	const router = useRouter()
	const queryClient = useQueryClient()
	const { toast } = useToast()
	const photoInputId = useId()
	const photoFileInputRef = useRef<HTMLInputElement>(null)

	const [photoBusy, setPhotoBusy] = useState(false)
	const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null)
	const [pendingPhotoBlobUrl, setPendingPhotoBlobUrl] = useState<string | null>(null)
	const [photoUrl, setPhotoUrl] = useState<string>("")

	const [pwShowCurrent, setPwShowCurrent] = useState(false)
	const [pwShowNew, setPwShowNew] = useState(false)
	const [pwShowConfirm, setPwShowConfirm] = useState(false)
	const [revokeOtherSessions, setRevokeOtherSessions] = useState(true)
	const [newPasswordDraft, setNewPasswordDraft] = useState("")

	const defaults = useMemo(
		() => ({
			firstName: user.firstName ?? "",
			lastName: user.lastName ?? "",
			middleName: user.middleName ?? "",
			email: user.email ?? "",
			profileImageUrl: user.profileImageUrl ?? user.image ?? "",
		}),
		[user.email, user.firstName, user.image, user.lastName, user.middleName, user.profileImageUrl]
	)

	useEffect(() => {
		setPhotoUrl(defaults.profileImageUrl)
	}, [defaults.profileImageUrl])

	useEffect(() => {
		if (!pendingPhotoFile) {
			setPendingPhotoBlobUrl(null)
			return
		}
		const u = URL.createObjectURL(pendingPhotoFile)
		setPendingPhotoBlobUrl(u)
		return () => URL.revokeObjectURL(u)
	}, [pendingPhotoFile])

	const updateProfileMutation = useMutation({
		mutationFn: async (input: { firstName?: string; lastName?: string; middleName?: string; profileImageUrl?: string }) => {
			return updateUser(user.id, {
				firstName: input.firstName || undefined,
				lastName: input.lastName || undefined,
				middleName: input.middleName || undefined,
				profileImageUrl: input.profileImageUrl || undefined,
			} as any)
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: sessionKeys.all })
			router.refresh()
			toast({ title: "Profile updated" })
		},
		onError: (err: unknown) => {
			toast({
				title: "Could not update profile",
				description: err instanceof Error ? err.message : "Please try again.",
				variant: "destructive",
			})
		},
	})

	const changePasswordMutation = useMutation({
		mutationFn: async (input: { currentPassword: string; newPassword: string; revokeOtherSessions: boolean }) => {
			const result = await authClient.changePassword(input)
			if (result.error) {
				throw new Error(result.error.message || "Failed to change password")
			}
			return result.data
		},
		onSuccess: () => {
			toast({ title: "Password updated" })
		},
		onError: (err: unknown) => {
			toast({
				title: "Could not change password",
				description: err instanceof Error ? err.message : "Please try again.",
				variant: "destructive",
			})
		},
	})

	const isPending = updateProfileMutation.isPending || changePasswordMutation.isPending

	const displayedPhotoSrc = pendingPhotoBlobUrl || (photoUrl?.trim() ? photoUrl.trim() : null)
	const pwStrength = passwordStrengthLabel(newPasswordDraft)

	return (
		<div className="flex w-full flex-col gap-6">
			<div className="flex flex-col gap-1">
				<h1 className="text-2xl font-semibold tracking-tight">Your profile</h1>
				<p className="text-muted-foreground text-sm">Update your information and security settings.</p>
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				<Card className="transition-shadow hover:shadow-sm">
					<CardHeader className="space-y-1.5">
						<CardTitle>Your information</CardTitle>
						<CardDescription>
							Keep your account details up to date. Your email is managed by sign-in settings.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form
							onSubmit={e => {
								e.preventDefault()
								const formData = new FormData(e.currentTarget)
								updateProfileMutation.mutate({
									firstName: String(formData.get("firstName") ?? ""),
									lastName: String(formData.get("lastName") ?? ""),
									middleName: String(formData.get("middleName") ?? ""),
									profileImageUrl: String(formData.get("profileImageUrl") ?? ""),
								})
							}}
							className="flex flex-col gap-5"
						>
							<div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
								<div className="flex items-center gap-3">
									<Avatar size="lg" className="size-12">
										{displayedPhotoSrc ? <AvatarImage src={displayedPhotoSrc} alt="" /> : null}
										<AvatarFallback>{initialsFromUser(user)}</AvatarFallback>
									</Avatar>
									<div className="min-w-0">
										<p className="truncate font-medium leading-tight">Profile photo</p>
										<p className="text-muted-foreground text-xs">
											PNG, JPG, WEBP, or GIF. Up to 1 MB.
										</p>
									</div>
								</div>

								<div className="flex flex-wrap items-center gap-2">
									<input
										ref={photoFileInputRef}
										id={photoInputId}
										type="file"
										accept={ACCEPTED_PROFILE_IMAGE_TYPES.join(",")}
										className="sr-only"
										tabIndex={-1}
										aria-hidden
										disabled={isPending || photoBusy}
										onChange={e => {
											const f = e.target.files?.[0] ?? null
											e.target.value = ""
											if (!f) return

											if (!ACCEPTED_PROFILE_IMAGE_TYPES.includes(f.type as any)) {
												toast({
													title: "Unsupported file type",
													description: "Please upload a PNG, JPG, WEBP, or GIF.",
													variant: "destructive",
												})
												return
											}

											if (f.size > MAX_PROFILE_IMAGE_BYTES) {
												toast({
													title: "File too large",
													description: "Please upload an image smaller than 1 MB.",
													variant: "destructive",
												})
												return
											}

											setPendingPhotoFile(f)
											setPhotoBusy(true)
											void fileToDataUrl(f)
												.then(dataUrl => {
													setPhotoUrl(dataUrl)
												})
												.catch(err => {
													toast({
														title: "Could not process image",
														description: err instanceof Error ? err.message : "Please try again.",
														variant: "destructive",
													})
												})
												.finally(() => setPhotoBusy(false))
										}}
									/>
									<Button
										type="button"
										variant="outline"
										size="sm"
										disabled={isPending || photoBusy}
										onClick={() => photoFileInputRef.current?.click()}
									>
										{photoBusy ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Upload data-icon="inline-start" />}
										Upload
									</Button>
									{(photoUrl?.trim() || pendingPhotoFile) && (
										<Button
											type="button"
											variant="ghost"
											size="sm"
											disabled={isPending || photoBusy}
											onClick={() => {
												setPendingPhotoFile(null)
												setPhotoUrl("")
												if (photoFileInputRef.current) photoFileInputRef.current.value = ""
											}}
										>
											Remove
										</Button>
									)}
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor={`${photoInputId}-url`} className="text-muted-foreground text-xs font-normal">
									Or paste an image URL
								</Label>
								<div className="relative">
									<Input
										id={`${photoInputId}-url`}
										name="profileImageUrl"
										type="url"
										placeholder="https://…"
										value={photoUrl}
										onChange={e => {
											setPendingPhotoFile(null)
											setPhotoUrl(e.target.value)
										}}
										disabled={isPending || photoBusy}
									/>
									{!displayedPhotoSrc ? (
										<ImageIcon
											aria-hidden
											className="text-muted-foreground pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2"
										/>
									) : null}
								</div>
								<p className="text-muted-foreground text-xs">
									We store the photo URL on your account. If you upload a file, it’s saved as a data URL.
								</p>
							</div>

							<FieldGroup>
								<Field>
									<FieldLabel>First name</FieldLabel>
									<Input name="firstName" defaultValue={defaults.firstName} disabled={isPending} />
									<p className="text-muted-foreground mt-1 text-xs">Optional.</p>
								</Field>
								<Field>
									<FieldLabel>Last name</FieldLabel>
									<Input name="lastName" defaultValue={defaults.lastName} disabled={isPending} required />
									<p className="text-muted-foreground mt-1 text-xs">Required so we can personalize your experience.</p>
								</Field>
								<Field>
									<FieldLabel>Middle name</FieldLabel>
									<Input name="middleName" defaultValue={defaults.middleName} disabled={isPending} />
								</Field>
								<Field>
									<FieldLabel>Email</FieldLabel>
									<Input
										name="email"
										type="email"
										defaultValue={defaults.email}
										readOnly
										disabled
										aria-readonly="true"
									/>
									<p className="text-muted-foreground mt-1 text-xs">
										Email is not editable here for security. If you need to change it, update your sign-in settings.
									</p>
								</Field>
							</FieldGroup>

							<CardFooter className="px-0 pt-1.5">
								<div className="flex w-full flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
									<p className="text-muted-foreground text-xs">
										Changes are saved to your account and may take a moment to reflect.
									</p>
									<Button type="submit" disabled={isPending}>
										{updateProfileMutation.isPending && <Spinner className="mr-2 size-4 animate-spin" />}
										Save changes
									</Button>
								</div>
							</CardFooter>
						</form>
					</CardContent>
				</Card>

				<Card className="transition-shadow hover:shadow-sm">
					<CardHeader className="space-y-1.5">
						<CardTitle>Change password</CardTitle>
						<CardDescription>
							Use a long passphrase. We’ll never show your current password, and you can sign out other sessions.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form
							onSubmit={e => {
								e.preventDefault()
								const formData = new FormData(e.currentTarget)
								const currentPassword = String(formData.get("currentPassword") ?? "")
								const newPassword = String(formData.get("newPassword") ?? "")
								const confirmPassword = String(formData.get("confirmPassword") ?? "")

								if (newPassword.length < 8) {
									toast({
										title: "Password too short",
										description: "Use at least 8 characters (12+ recommended).",
										variant: "destructive",
									})
									return
								}

								if (newPassword !== confirmPassword) {
									toast({
										title: "Passwords don’t match",
										description: "Double-check the new password and confirmation.",
										variant: "destructive",
									})
									return
								}

								changePasswordMutation.mutate({
									currentPassword,
									newPassword,
									revokeOtherSessions,
								})
							}}
							className="flex flex-col gap-5"
						>
							<FieldGroup>
								<Field>
									<FieldLabel>Current password</FieldLabel>
									<div className="relative">
										<Input
											name="currentPassword"
											type={pwShowCurrent ? "text" : "password"}
											autoComplete="current-password"
											disabled={isPending}
											required
										/>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											className="absolute right-1 top-1/2 h-7 -translate-y-1/2 px-2"
											onClick={() => setPwShowCurrent(v => !v)}
											disabled={isPending}
											aria-label={pwShowCurrent ? "Hide current password" : "Show current password"}
										>
											{pwShowCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
										</Button>
									</div>
									<p className="text-muted-foreground mt-1 text-xs">
										If you’re having trouble, check Caps Lock or try your last known password.
									</p>
								</Field>

								<Field>
									<FieldLabel>New password</FieldLabel>
									<div className="relative">
										<Input
											name="newPassword"
											type={pwShowNew ? "text" : "password"}
											autoComplete="new-password"
											disabled={isPending}
											required
											onChange={e => setNewPasswordDraft(e.target.value)}
										/>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											className="absolute right-1 top-1/2 h-7 -translate-y-1/2 px-2"
											onClick={() => setPwShowNew(v => !v)}
											disabled={isPending}
											aria-label={pwShowNew ? "Hide new password" : "Show new password"}
										>
											{pwShowNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
										</Button>
									</div>
									<p
										className={[
											"mt-1 text-xs",
											pwStrength.tone === "good"
												? "text-emerald-600 dark:text-emerald-400"
												: pwStrength.tone === "warn"
													? "text-destructive"
													: "text-muted-foreground",
										].join(" ")}
									>
										{pwStrength.label}
									</p>
								</Field>

								<Field>
									<FieldLabel>Confirm new password</FieldLabel>
									<div className="relative">
										<Input
											name="confirmPassword"
											type={pwShowConfirm ? "text" : "password"}
											autoComplete="new-password"
											disabled={isPending}
											required
										/>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											className="absolute right-1 top-1/2 h-7 -translate-y-1/2 px-2"
											onClick={() => setPwShowConfirm(v => !v)}
											disabled={isPending}
											aria-label={pwShowConfirm ? "Hide confirmation password" : "Show confirmation password"}
										>
											{pwShowConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
										</Button>
									</div>
								</Field>
							</FieldGroup>

							<div className="flex items-start gap-2 rounded-xl border border-border/60 bg-muted/20 p-4">
								<Checkbox
									checked={revokeOtherSessions}
									onCheckedChange={v => setRevokeOtherSessions(Boolean(v))}
									disabled={isPending}
									id="revokeOtherSessions"
								/>
								<div className="grid gap-1">
									<Label htmlFor="revokeOtherSessions" className="leading-tight">
										Sign out of other devices
									</Label>
									<p className="text-muted-foreground text-xs">
										Recommended if you’ve shared a device or suspect someone else has access.
									</p>
								</div>
							</div>

							<CardFooter className="px-0 pt-1.5">
								<div className="flex w-full items-center justify-end">
									<Button type="submit" disabled={isPending}>
										{changePasswordMutation.isPending && <Spinner className="mr-2 size-4 animate-spin" />}
										Update password
									</Button>
								</div>
							</CardFooter>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}

