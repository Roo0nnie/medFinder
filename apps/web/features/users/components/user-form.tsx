"use client"

import { useForm } from "@tanstack/react-form"
import Link from "next/link"

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
import { useToast } from "@/core/components/ui/use-toast"

import type { CreateUserInput, User } from "@repo/contracts"

import { useCreateUserMutation, useUpdateUserMutation } from "../api/users.hooks"

const ROLES = ["admin", "owner", "staff", "customer"] as const

interface UserFormProps {
	user?: User | null
	onSuccess?: () => void
}

export function UserForm({ user, onSuccess }: UserFormProps) {
	const isEdit = !!user
	const { toast } = useToast()
	const { mutateAsync: createUser, isPending: isCreatePending } = useCreateUserMutation()
	const { mutateAsync: updateUser, isPending: isUpdatePending } = useUpdateUserMutation()
	const isPending = isCreatePending || isUpdatePending

	const form = useForm({
		defaultValues: {
			firstName: user?.firstName ?? "",
			lastName: user?.lastName ?? "",
			middleName: user?.middleName ?? "",
			email: user?.email ?? "",
			password: "",
			role: (user?.role as (typeof ROLES)[number]) ?? "customer",
		},
		onSubmit: async ({ value }) => {
			try {
				if (isEdit && user) {
					await updateUser({
						id: user.id,
						firstName: value.firstName || undefined,
						lastName: value.lastName,
						middleName: value.middleName || undefined,
						email: value.email,
						role: value.role,
					})
					toast({ title: "User updated" })
				} else {
					const input: CreateUserInput = {
						email: value.email,
						lastName: value.lastName,
						firstName: value.firstName || undefined,
						middleName: value.middleName || undefined,
						role: value.role,
					}
					if (value.password) input.password = value.password
					await createUser(input)
					toast({ title: "User created" })
				}
				onSuccess?.()
			} catch (e) {
				toast({
					title: isEdit ? "Update failed" : "Create failed",
					description: e instanceof Error ? e.message : "Unknown error",
					variant: "destructive",
				})
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
							<FieldLabel>Middle name</FieldLabel>
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
				{!isEdit && (
					<form.Field
						name="password"
						children={field => (
							<Field>
								<FieldLabel>Password (optional)</FieldLabel>
								<Input
									id={field.name}
									type="password"
									value={field.state.value}
									onChange={e => field.handleChange(e.target.value)}
									disabled={isPending}
								/>
							</Field>
						)}
					/>
				)}
				<form.Field
					name="role"
					children={field => (
						<Field>
							<FieldLabel>Role</FieldLabel>
							<Select
								value={field.state.value}
								onValueChange={v => field.handleChange(v as (typeof ROLES)[number])}
								disabled={isPending}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{ROLES.map(r => (
										<SelectItem key={r} value={r}>
											{r}
										</SelectItem >
									))}
								</SelectContent>
							</Select>
						</Field>
					)}
				/>
			</FieldGroup>
			<div className="flex gap-2">
				<Button type="submit" disabled={isPending}>
					{isPending && <Spinner className="mr-2 size-4 animate-spin" />}
					{isEdit ? "Update" : "Create"} user
				</Button>
				<Button type="button" variant="outline" >
					<Link href="/users">Cancel</Link>
				</Button>
			</div>
		</form>
	)
}
