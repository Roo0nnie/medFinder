"use client"

import { Card, CardContent } from "@/core/components/ui/card"
import { CategoriesTable } from "@/features/products/components/categories-table"

export default function OwnerCategoriesTabPage() {
	return (
		<div className="space-y-6">
			<Card>
				<CardContent className="p-4 sm:p-6">
					<div className="flex items-center justify-between">
						<div>
							<h2 className="text-lg font-semibold">Category</h2>
							<p className="text-muted-foreground text-sm">
								Create and maintain categories for your products.
							</p>
						</div>
					</div>

					<div className="mt-4">
						<CategoriesTable />
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
