"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/core/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/core/components/ui/card"
import { Input } from "@/core/components/ui/input"
import { Label } from "@/core/components/ui/label"
import { authClient } from "@/services/better-auth/auth-client"

export default function LoginPage() {
	const router = useRouter()
	const session = authClient.useSession()
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [error, setError] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(false)

	// Redirect if already logged in
	useEffect(() => {
		if (session.data?.user && !session.isPending) {
			router.push("/")
		}
	}, [session.data?.user, session.isPending, router])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError(null)
		setIsLoading(true)

		try {
			const result = await authClient.signIn.email({
				email,
				password,
			})

			if (result.error) {
				setError(result.error.message || "Failed to sign in")
			} else {
				// Redirect to home page on success
				router.push("/")
				router.refresh()
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "An unexpected error occurred")
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle className="text-xl">Login</CardTitle>
				<CardDescription>Sign in to your account using email and password</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							placeholder="you@example.com"
							value={email}
							onChange={e => setEmail(e.target.value)}
							required
							disabled={isLoading}
							autoComplete="email"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="password">Password</Label>
						<Input
							id="password"
							type="password"
							placeholder="••••••••"
							value={password}
							onChange={e => setPassword(e.target.value)}
							required
							disabled={isLoading}
							autoComplete="current-password"
						/>
					</div>
					{error && (
						<div className="bg-destructive/10 text-destructive dark:bg-destructive/20 rounded-lg p-3 text-sm">
							{error}
						</div>
					)}
					<Button type="submit" className="w-full" disabled={isLoading}>
						{isLoading ? "Signing in..." : "Sign in"}
					</Button>
				</form>
			</CardContent>
		</Card>
	)
}
