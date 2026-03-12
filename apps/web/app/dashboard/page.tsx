import { redirect } from "next/navigation"

import { getSession } from "@/services/better-auth/auth-server"

export default async function DashboardIndexPage() {
	const session = await getSession()
	const role =
		(session?.user as { role?: "admin" | "owner" | "staff" | "customer" } | undefined)?.role ??
		"customer"

	if (role === "admin") {
		redirect("/dashboard/admin")
	}

	if (role === "owner") {
		redirect("/dashboard/owner")
	}

	if (role === "staff") {
		redirect("/dashboard/staff")
	}

	redirect("/")
}
