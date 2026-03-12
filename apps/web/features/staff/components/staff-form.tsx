 "use client"

import { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useQueryClient } from "@tanstack/react-query"

import { Button } from "@/core/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/core/components/ui/field"
import { Input } from "@/core/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/core/components/ui/select"
import { Spinner } from "@/core/components/ui/spinner"
import { usersQueryKey } from "@/features/users/api/users.hooks"

import { staffQueryKey, useUpdateStaffMutation } from "../api/staff.hooks"

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
	const [error, setError] = useState<string | null>(null)
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
			userId: staff?.userId ?? "",
			department: staff?.department ?? "",
			position: staff?.position ?? "",
			specialization: staff?.specialization ?? "",
			bio: staff?.bio ?? "",
			phone: staff?.phone ?? "",
			isActive: staff?.isActive ?? true,
		},
		onSubmit: async ({ value }) => {
			setError(null)

			if (isEdit && staff) {
				await updateStaff({
					id: staff.id,
					department: value.department || undefined,
					position: value.position || undefined,
					specialization: value.specialization || undefined,
					bio: value.bio || undefined,
					phone: value.phone || undefined,
					isActive: value.isActive,
				} as any)
				onSuccess?.()
				return
			}

			setIsAccountPending(true)
			try {
				if (!value.email || !value.password || !value.firstName || !value.lastName) {
					throw new Error("Please fill in account details")
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
							phone: value.phone || undefined,
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
				onSuccess?.()
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to create staff account")
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
			className="flex flex-col gap-4"
		>
			<FieldGroup>
				{!isEdit && (
					<>
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
									/>
								</Field>
							)}
						/>

						<form.Field
							name="middleName"
							children={field => (
								<Field>
									<FieldLabel>Middle name (optional)</FieldLabel>
									<Input
										id={field.name}
										value={field.state.value}
										onChange={e => field.handleChange(e.target.value)}
										disabled={isPending}
									/>
								</Field>
							)}
						/>

						<form.Field
							name="email"
							children={field => (
								<Field>
									<FieldLabel>Email</FieldLabel>
									<Input
										id={field.name}
										type="email"
										value={field.state.value}
										onChange={e => field.handleChange(e.target.value)}
										disabled={isPending}
										required
									/>
								</Field>
							)}
						/>

						<form.Field
							name="password"
							children={field => (
								<Field>
									<FieldLabel>Password</FieldLabel>
									<Input
										id={field.name}
										type="password"
										value={field.state.value}
										onChange={e => field.handleChange(e.target.value)}
										disabled={isPending}
										required
										minLength={8}
									/>
								</Field>
							)}
						/>
					</>
				)}

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
							/>
						</Field>
					)}
				/>

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
							/>
						</Field>
					)}
				/>

				<form.Field
					name="phone"
					children={field => (
						<Field>
							<FieldLabel>Phone (optional)</FieldLabel>
							<Input
								id={field.name}
								value={field.state.value}
								onChange={e => field.handleChange(e.target.value)}
								disabled={isPending}
							/>
						</Field>
					)}
				/>

				<form.Field
					name="bio"
					children={field => (
						<Field>
							<FieldLabel>Bio (optional)</FieldLabel>
							<Input
								id={field.name}
								value={field.state.value}
								onChange={e => field.handleChange(e.target.value)}
								disabled={isPending}
							/>
						</Field>
					)}
				/>

				<form.Field
					name="isActive"
					children={field => (
						<Field>
							<FieldLabel>Status</FieldLabel>
							<Select
								value={field.state.value ? "active" : "inactive"}
								onValueChange={value => field.handleChange(value === "active")}
								disabled={isPending}
							>
								<SelectTrigger>
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
			</FieldGroup>

			{error && <p className="text-destructive text-sm">{error}</p>}

			<div className="flex justify-end gap-2">
				<Button type="submit" disabled={isPending}>
					{isPending && <Spinner className="mr-2 size-4 animate-spin" />}
					{isEdit ? "Update staff" : "Create staff"}
				</Button>
			</div>
		</form>
	)
}
