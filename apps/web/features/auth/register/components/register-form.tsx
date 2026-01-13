"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "@tanstack/react-form"

import { Button } from "@/core/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/core/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/core/components/ui/field"
import { Input } from "@/core/components/ui/input"
import { authClient } from "@/services/better-auth/auth-client"

import { useRegisterMutation } from "../api/register.api"
import { RegisterSchema, type Register } from "../api/register.schema"

export function RegisterForm() {
	const router = useRouter()
	const session = authClient.useSession()
	const registerMutation = useRegisterMutation()

	// Redirect if already logged in
	useEffect(() => {
		if (session.data?.user && !session.isPending) {
			router.push("/")
		}
	}, [session.data?.user, session.isPending, router])

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
			name: "",
		},
		validators: {
			onChange: RegisterSchema,
			onBlur: RegisterSchema,
			onSubmit: RegisterSchema,
		},
		onSubmit: async ({ value }) => {
			// Transform empty string to undefined to match Register type
			const registerData: Register = {
				email: value.email,
				password: value.password,
				name: value.name || "",
			}
			await registerMutation.mutateAsync(registerData)
		},
	})

	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle className="text-xl">Register</CardTitle>
				<CardDescription>Create a new account using email and password</CardDescription>
			</CardHeader>
			<CardContent>
				<form
					onSubmit={e => {
						e.preventDefault()
						form.handleSubmit()
					}}
				>
					<FieldGroup>
						<form.Field
							name="name"
							children={field => {
								const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>Name</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											type="text"
											value={field.state.value || ""}
											onBlur={field.handleBlur}
											onChange={e => field.handleChange(e.target.value)}
											aria-invalid={isInvalid}
											placeholder="John Doe"
											autoComplete="name"
											disabled={registerMutation.isPending}
										/>
										{isInvalid && <FieldError errors={field.state.meta.errors} />}
									</Field>
								)
							}}
						/>

						<form.Field
							name="email"
							children={field => {
								const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>Email</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											type="email"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={e => field.handleChange(e.target.value)}
											aria-invalid={isInvalid}
											placeholder="you@example.com"
											autoComplete="email"
											disabled={registerMutation.isPending}
										/>
										{isInvalid && <FieldError errors={field.state.meta.errors} />}
									</Field>
								)
							}}
						/>

						<form.Field
							name="password"
							children={field => {
								const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>Password</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											type="password"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={e => field.handleChange(e.target.value)}
											aria-invalid={isInvalid}
											placeholder="••••••••"
											autoComplete="new-password"
											disabled={registerMutation.isPending}
										/>
										{isInvalid && <FieldError errors={field.state.meta.errors} />}
									</Field>
								)
							}}
						/>
					</FieldGroup>

					{registerMutation.isError && (
						<div className="bg-destructive/10 text-destructive dark:bg-destructive/20 mb-4 rounded-lg p-3 text-sm">
							{registerMutation.error instanceof Error
								? registerMutation.error.message
								: "An unexpected error occurred"}
						</div>
					)}

					<Button type="submit" className="w-full" disabled={registerMutation.isPending}>
						{registerMutation.isPending ? "Creating account..." : "Create account"}
					</Button>
				</form>
			</CardContent>
		</Card>
	)
}
