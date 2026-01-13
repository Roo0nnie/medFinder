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

import { useLoginMutation } from "../api/login.api"
import { LoginSchema } from "../api/login.schema"

export function LoginForm() {
	const router = useRouter()
	const session = authClient.useSession()
	const loginMutation = useLoginMutation()

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
		},
		validators: {
			onChange: LoginSchema,
			onBlur: LoginSchema,
			onSubmit: LoginSchema,
		},
		onSubmit: async ({ value }) => {
			await loginMutation.mutateAsync(value)
		},
	})

	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle className="text-xl">Login</CardTitle>
				<CardDescription>Sign in to your account using email and password</CardDescription>
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
											disabled={loginMutation.isPending}
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
											autoComplete="current-password"
											disabled={loginMutation.isPending}
										/>
										{isInvalid && <FieldError errors={field.state.meta.errors} />}
									</Field>
								)
							}}
						/>
					</FieldGroup>

					{loginMutation.isError && (
						<div className="bg-destructive/10 text-destructive dark:bg-destructive/20 mb-4 rounded-lg p-3 text-sm">
							{loginMutation.error instanceof Error
								? loginMutation.error.message
								: "An unexpected error occurred"}
						</div>
					)}

					<Button type="submit" className="w-full" disabled={loginMutation.isPending}>
						{loginMutation.isPending ? "Signing in..." : "Sign in"}
					</Button>
				</form>
			</CardContent>
		</Card>
	)
}
