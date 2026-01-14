"use client"

import { useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "@tanstack/react-form"

import { Button, buttonVariants } from "@/core/components/ui/button"
import { Card, CardContent } from "@/core/components/ui/card"
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldSeparator,
} from "@/core/components/ui/field"
import { Input } from "@/core/components/ui/input"
import { cn } from "@/core/lib/utils"
import { authClient } from "@/services/better-auth/auth-client"
import { SocialLoginButtons } from "@/features/auth/components/social-login-buttons"
import { TermsPrivacyNote } from "@/features/auth/components/terms-privacy-note"

import { useRegisterMutation } from "../api/register.api"
import { RegisterSchema, type Register } from "../api/register.schema"

export function RegisterForm({ className, ...props }: React.ComponentProps<"div">) {
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
		<div className={cn("flex flex-col gap-6", className)} {...props}>
			<Card className="overflow-hidden p-0">
				<CardContent className="grid p-0 md:grid-cols-2">
					<form
						className="p-6 md:p-8"
						onSubmit={e => {
							e.preventDefault()
							form.handleSubmit()
						}}
					>
						<FieldGroup>
							<div className="flex flex-col items-center gap-2 text-center">
								<h1 className="text-2xl font-bold">Create an account</h1>
								<p className="text-muted-foreground text-balance">Sign up to get started</p>
							</div>

							{registerMutation.isError && (
								<div className="bg-destructive/10 text-destructive dark:bg-destructive/20 rounded-lg p-3 text-sm">
									{registerMutation.error instanceof Error
										? registerMutation.error.message
										: "An unexpected error occurred"}
								</div>
							)}

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
												placeholder="m@example.com"
												autoComplete="email"
												required
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
												required
												autoComplete="new-password"
												disabled={registerMutation.isPending}
											/>
											{isInvalid && <FieldError errors={field.state.meta.errors} />}
										</Field>
									)
								}}
							/>

							<Field>
								<Button
									type="submit"
									disabled={registerMutation.isPending}
									className="w-full hover:cursor-pointer"
								>
									{registerMutation.isPending ? "Creating account..." : "Create account"}
								</Button>
							</Field>

							<FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
								Or continue with
							</FieldSeparator>

							<SocialLoginButtons action="signup" />

							<FieldDescription className="text-center">
								Already have an account?{" "}
								<Link
									className={cn(
										buttonVariants({ variant: "link" }),
										"text-muted-foreground h-auto px-0"
									)}
									href="/login"
								>
									Sign in
								</Link>
							</FieldDescription>
						</FieldGroup>
					</form>
					<div className="bg-muted relative hidden md:block">
						<Image
							src="/placeholder.svg"
							alt="Image"
							fill
							className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
						/>
					</div>
				</CardContent>
			</Card>
			<TermsPrivacyNote />
		</div>
	)
}
