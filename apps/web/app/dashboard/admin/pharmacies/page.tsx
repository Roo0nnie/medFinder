import type { Route } from "next"
import { redirect } from "next/navigation"

export default function AdminPharmaciesIndexPage() {
	redirect("/dashboard/admin/pharmacies/pending" as Route)
}
