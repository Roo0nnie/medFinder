"use client"

import { useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "@tanstack/react-form"

import { Button } from "@/core/components/ui/button"
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

import { useLoginMutation } from "../api/login.api"
import { LoginSchema } from "../api/login.schema"

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
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
			onSubmit: LoginSchema,
		},
		onSubmit: async ({ value }) => {
			await loginMutation.mutateAsync(value)
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
								<h1 className="text-2xl font-bold">Welcome back</h1>
								<p className="text-muted-foreground text-balance">Login to your account</p>
							</div>

							{loginMutation.isError && (
								<div className="bg-destructive/10 text-destructive dark:bg-destructive/20 rounded-lg p-3 text-sm">
									{loginMutation.error instanceof Error
										? loginMutation.error.message
										: "An unexpected error occurred"}
								</div>
							)}

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
											<div className="flex items-center">
												<FieldLabel htmlFor={field.name}>Password</FieldLabel>
												<Link
													href="#"
													className="ml-auto text-sm underline-offset-2 hover:underline"
												>
													Forgot your password?
												</Link>
											</div>
											<Input
												id={field.name}
												name={field.name}
												type="password"
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={e => field.handleChange(e.target.value)}
												aria-invalid={isInvalid}
												required
												autoComplete="current-password"
												disabled={loginMutation.isPending}
											/>
											{isInvalid && <FieldError errors={field.state.meta.errors} />}
										</Field>
									)
								}}
							/>

							<Field>
								<Button
									type="submit"
									disabled={loginMutation.isPending}
									className="w-full hover:cursor-pointer"
								>
									{loginMutation.isPending ? "Signing in..." : "Login"}
								</Button>
							</Field>

							<FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
								Or continue with
							</FieldSeparator>

							<SocialLoginButtons action="login" />

							<FieldDescription className="text-center">
								Don&apos;t have an account? <Link href="/register">Sign up</Link>
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
			<FieldDescription className="px-6 text-center">
				By clicking continue, you agree to our <Link href="#">Terms of Service</Link> and{" "}
				<Link href="#">Privacy Policy</Link>.
			</FieldDescription>
		</div>
	)
}
