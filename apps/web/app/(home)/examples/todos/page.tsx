import { redirect } from "next/navigation"

import { getSession } from "@/services/better-auth/auth-server"
import { TodosPage } from "@/features/todos/components/todos-page"

export default async function TodosRoutePage() {
	const session = await getSession()

	if (!session) {
		redirect("/login")
	}

	return <TodosPage />
}
