"use client"

import { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useQueryClient } from "@tanstack/react-query"

import { Button } from "@/core/components/ui/button"
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet,
} from "@/core/components/ui/field"
import {
	isValidOptionalPhMobileDisplay,
	maskPhMobileInput,
	phMobileDisplayToStored,
	phMobileStoredToDisplay,
} from "@/core/lib/ph-mobile-phone"
import { Input } from "@/core/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/core/components/ui/select"
import { Spinner } from "@/core/components/ui/spinner"
import { useToast } from "@/core/components/ui/use-toast"
import { PasswordInput } from "@/features/auth/components/password-input"
import { usersQueryKey } from "@/features/users/api/users.hooks"

import { staffQueryKey, useUpdateStaffMutation } from "../api/staff.hooks"

const formTwoColumnGridClass = "grid w-full grid-cols-1 gap-4 sm:grid-cols-2"

interface StaffFormProps {
	staff?: {
		id: string
		userId: string
		department: string
		position: string
		specialization?: string | null
		bio?: string | null
		phone?: string | null
		isActive: boolean
	}
	onSuccess?: () => void
}

export function StaffForm({ staff, onSuccess }: StaffFormProps) {
	const isEdit = !!staff
	const queryClient = useQueryClient()
	const { toast } = useToast()
	const [isAccountPending, setIsAccountPending] = useState(false)

	const { mutateAsync: updateStaff, isPending: isUpdatePending } = useUpdateStaffMutation()
	const isPending = isUpdatePending || isAccountPending

	const form = useForm({
		defaultValues: {
			firstName: "",
			lastName: "",
			middleName: "",
			email: "",
			password: "",
			confirmPassword: "",
			userId: staff?.userId ?? "",
			department: staff?.department ?? "",
			position: staff?.position ?? "",
			specialization: staff?.specialization ?? "",
			bio: staff?.bio ?? "",
			phone: phMobileStoredToDisplay(staff?.phone ?? null),
			isActive: staff?.isActive ?? true,
		},
		onSubmit: async ({ value }) => {
			if (isEdit && staff) {
				try {
					await updateStaff({
						id: staff.id,
						department: value.department || undefined,
						position: value.position || undefined,
						specialization: value.specialization || undefined,
						bio: value.bio || undefined,
						phone: phMobileDisplayToStored(value.phone) ?? undefined,
						isActive: value.isActive,
					} as any)
					toast({ title: "Staff updated" })
					onSuccess?.()
				} catch (e) {
					toast({
						title: "Update failed",
						description: e instanceof Error ? e.message : "Unknown error",
						variant: "destructive",
					})
				}
				return
			}

			setIsAccountPending(true)
			try {
				if (!value.email || !value.password || !value.firstName || !value.lastName) {
					toast({
						title: "Validation",
						description: "Please fill in account details.",
						variant: "destructive",
					})
					return
				}
				if (value.password !== value.confirmPassword) {
					toast({
						title: "Validation",
						description: "Passwords do not match.",
						variant: "destructive",
					})
					return
				}
				if (value.password.length < 8) {
					toast({
						title: "Validation",
						description: "Password must be at least 8 characters.",
						variant: "destructive",
					})
					return
				}

				const response = await fetch("/api/staff/create-with-account", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						account: {
							firstName: value.firstName,
							lastName: value.lastName,
							middleName: value.middleName || undefined,
							email: value.email,
							password: value.password,
						},
						staff: {
							department: value.department,
							position: value.position,
							specialization: value.specialization || undefined,
							bio: value.bio || undefined,
							phone: phMobileDisplayToStored(value.phone) ?? undefined,
							isActive: value.isActive,
						},
					}),
				})

				if (!response.ok) {
					let message = "Failed to create staff account"
					try {
						const body = await response.json()
						message = body?.message ?? message
					} catch (e) {
						message = (await response.text()) || message
					}
					throw new Error(message)
				}

				await queryClient.invalidateQueries({ queryKey: staffQueryKey })
				await queryClient.invalidateQueries({ queryKey: usersQueryKey })
				toast({ title: "Staff member added" })
				onSuccess?.()
			} catch (err) {
				toast({
					title: "Create failed",
					description: err instanceof Error ? err.message : "Failed to create staff account",
					variant: "destructive",
				})
			} finally {
				setIsAccountPending(false)
			}
		},
	})

	return (
		<form
			onSubmit={e => {
				e.preventDefault()
				form.handleSubmit()
			}}
			className="flex flex-col gap-6"
		>
			<FieldGroup className="gap-8">
				{!isEdit && (
					<>
						<FieldSet className="min-w-0 space-y-4 border-0 p-0">
							<FieldLegend variant="label" className="text-foreground">
								Account & sign-in
							</FieldLegend>
							<FieldDescription>
								These credentials are used to sign in to the dashboard.
							</FieldDescription>
							<div className={formTwoColumnGridClass}>
								<form.Field
									name="email"
									children={field => (
										<Field className="sm:col-span-2">
											<FieldLabel>Email</FieldLabel>
											<Input
												id={field.name}
												type="email"
												autoComplete="email"
												value={field.state.value}
												onChange={e => field.handleChange(e.target.value)}
												disabled={isPending}
												required
												placeholder="name@pharmacy.com"
											/>
										</Field>
									)}
								/>
								<form.Field
									name="password"
									children={field => (
										<Field>
											<FieldLabel>Password</FieldLabel>
											<PasswordInput
												id={field.name}
												autoComplete="new-password"
												value={field.state.value}
												onChange={e => field.handleChange(e.target.value)}
												disabled={isPending}
												required
												minLength={8}
												placeholder="At least 8 characters"
												className="w-full"
											/>
										</Field>
									)}
								/>
								<form.Field
									name="confirmPassword"
									children={field => (
										<Field>
											<FieldLabel>Confirm password</FieldLabel>
											<PasswordInput
												id={field.name}
												autoComplete="new-password"
												value={field.state.value}
												onChange={e => field.handleChange(e.target.value)}
												disabled={isPending}
												required
												minLength={8}
												placeholder="Re-enter password"
												className="w-full"
											/>
										</Field>
									)}
								/>
							</div>
						</FieldSet>

						<FieldSet className="min-w-0 space-y-4 border-0 p-0">
							<FieldLegend variant="label" className="text-foreground">
								Legal name
							</FieldLegend>
							<FieldDescription>Must match the name on the staff member&apos;s ID where applicable.</FieldDescription>
							<div className={formTwoColumnGridClass}>
								<form.Field
									name="firstName"
									children={field => (
										<Field>
											<FieldLabel>First name</FieldLabel>
											<Input
												id={field.name}
												value={field.state.value}
												onChange={e => field.handleChange(e.target.value)}
												disabled={isPending}
												required
												placeholder="e.g. Jane"
											/>
										</Field>
									)}
								/>
								<form.Field
									name="lastName"
									children={field => (
										<Field>
											<FieldLabel>Last name</FieldLabel>
											<Input
												id={field.name}
												value={field.state.value}
												onChange={e => field.handleChange(e.target.value)}
												disabled={isPending}
												required
												placeholder="e.g. Doe"
											/>
										</Field>
									)}
								/>
								<form.Field
									name="middleName"
									children={field => (
										<Field className="sm:col-span-2">
											<FieldLabel>Middle name (optional)</FieldLabel>
											<Input
												id={field.name}
												value={field.state.value}
												onChange={e => field.handleChange(e.target.value)}
												disabled={isPending}
												placeholder="e.g. Marie"
											/>
										</Field>
									)}
								/>
							</div>
						</FieldSet>
					</>
				)}

				<FieldSet className="min-w-0 space-y-4 border-0 p-0">
					<FieldLegend variant="label" className="text-foreground">
						Role & organization
					</FieldLegend>
					<FieldDescription>Where they work and their job title on the team.</FieldDescription>
					<div className={formTwoColumnGridClass}>
						<form.Field
							name="department"
							children={field => (
								<Field>
									<FieldLabel>Department</FieldLabel>
									<Input
										id={field.name}
										value={field.state.value}
										onChange={e => field.handleChange(e.target.value)}
										disabled={isPending}
										required
										placeholder="e.g. Clinical services"
									/>
								</Field>
							)}
						/>
						<form.Field
							name="position"
							children={field => (
								<Field>
									<FieldLabel>Position</FieldLabel>
									<Input
										id={field.name}
										value={field.state.value}
										onChange={e => field.handleChange(e.target.value)}
										disabled={isPending}
										required
										placeholder="e.g. Pharmacist"
									/>
								</Field>
							)}
						/>
					</div>
				</FieldSet>

				<FieldSet className="min-w-0 space-y-4 border-0 p-0">
					<FieldLegend variant="label" className="text-foreground">
						Contact & professional profile
					</FieldLegend>
					<FieldDescription>Optional details shown internally or on their profile.</FieldDescription>
					<div className={formTwoColumnGridClass}>
						<form.Field
							name="specialization"
							children={field => (
								<Field>
									<FieldLabel>Specialization (optional)</FieldLabel>
									<Input
										id={field.name}
										value={field.state.value}
										onChange={e => field.handleChange(e.target.value)}
										disabled={isPending}
										placeholder="e.g. Clinical pharmacy"
									/>
								</Field>
							)}
						/>
						<form.Field
							name="phone"
							validators={{
								onChange: ({ value }) =>
									!isValidOptionalPhMobileDisplay(value)
										? { message: "Use +63 09 followed by exactly 9 digits, or leave blank." }
										: undefined,
							}}
							children={field => {
								const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>Phone (optional)</FieldLabel>
										<Input
											id={field.name}
											type="tel"
											inputMode="numeric"
											autoComplete="tel"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={e => field.handleChange(maskPhMobileInput(e.target.value))}
											disabled={isPending}
											placeholder="+63 09 123456789"
											aria-invalid={isInvalid}
										/>
										<FieldDescription>Philippine mobile: +63 09 and 9 digits after 09.</FieldDescription>
										{isInvalid && <FieldError errors={field.state.meta.errors} />}
									</Field>
								)
							}}
						/>
						<form.Field
							name="bio"
							children={field => (
								<Field className="sm:col-span-2">
									<FieldLabel>Bio (optional)</FieldLabel>
									<Input
										id={field.name}
										value={field.state.value}
										onChange={e => field.handleChange(e.target.value)}
										disabled={isPending}
										placeholder="Short professional bio (optional)"
									/>
								</Field>
							)}
						/>
					</div>
				</FieldSet>

				<FieldSet className="min-w-0 space-y-4 border-0 p-0">
					<FieldLegend variant="label" className="text-foreground">
						Status
					</FieldLegend>
					<FieldDescription>Inactive staff cannot be assigned new work until reactivated.</FieldDescription>
					<div className="max-w-xs">
						<form.Field
							name="isActive"
							children={field => (
								<Field>
									<FieldLabel>Account status</FieldLabel>
									<Select
										value={field.state.value ? "active" : "inactive"}
										onValueChange={value => field.handleChange(value === "active")}
										disabled={isPending}
									>
										<SelectTrigger className="w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="active">Active</SelectItem>
											<SelectItem value="inactive">Inactive</SelectItem>
										</SelectContent>
									</Select>
								</Field>
							)}
						/>
					</div>
				</FieldSet>
			</FieldGroup>

			<div className="flex justify-end gap-2">
				<Button type="submit" disabled={isPending}>
					{isPending && <Spinner className="mr-2 size-4 animate-spin" />}
					{isEdit ? "Update staff" : "Create staff"}
				</Button>
			</div>
		</form>
	)
}
