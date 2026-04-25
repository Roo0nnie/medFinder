"use client"

import { createContext, useContext, type ReactNode } from "react"

import { authClient } from "@/services/better-auth/auth-client"

interface AuthContextType {
	session: { user?: { id: string; email: string; name: string; role?: string } } | null
	isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
	const { data: session, isPending: isLoading } = authClient.useSession()

	return <AuthContext.Provider value={{ session, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
	const context = useContext(AuthContext)
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider")
	}
	return context
}
