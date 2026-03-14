import type { Route } from "next"
import { redirect } from "next/navigation"

export default function OwnerProductsIndexPage() {
	redirect("/dashboard/owner/products/product" as Route)
}
