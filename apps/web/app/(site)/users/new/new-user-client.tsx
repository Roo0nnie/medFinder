"use client"

import { useRouter } from "next/navigation"

import { UserForm } from "@/features/users/components/user-form"

export function NewUserClient() {
	const router = useRouter()
	return (
		<UserForm
			onSuccess={() => {
				router.push("/users")
				router.refresh()
			}}
		/>
	)
}
