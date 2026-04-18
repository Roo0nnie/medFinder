"use client"

import { useRef, useState } from "react"
import { Plus, Trash2 } from "lucide-react"

import { Button } from "@/core/components/ui/button"
import { Card, CardContent } from "@/core/components/ui/card"
import {
	CategoriesTable,
	type CategoriesTableHandle,
	type CategoryRow,
} from "@/features/products/components/categories-table"

export function OwnerCategorySection() {
	const categoriesTableRef = useRef<CategoriesTableHandle>(null)
	const [selectedCategories, setSelectedCategories] = useState<CategoryRow[]>([])

	return (
		<div className="space-y-6">
			<Card>
				<CardContent className="p-4 sm:p-6">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div>
							<h2 className="text-lg font-semibold">Category</h2>
							<p className="text-muted-foreground text-sm">
								Create and maintain categories for your products.
							</p>
						</div>
						<div className="flex flex-wrap items-center justify-end gap-2">
							<Button onClick={() => categoriesTableRef.current?.openCreate()}>
								<Plus className="mr-2 h-4 w-4" />
								Add category
							</Button>
							{selectedCategories.length > 0 ? (
								<Button
									type="button"
									variant="destructive"
									size="sm"
									className="h-9"
									onClick={() => categoriesTableRef.current?.requestBulkDelete()}
								>
									<Trash2 className="mr-2 h-4 w-4" />
									Delete {selectedCategories.length}{" "}
									{selectedCategories.length === 1 ? "Category" : "Categories"}
								</Button>
							) : null}
						</div>
					</div>

					<div className="mt-4">
						<CategoriesTable ref={categoriesTableRef} onSelectionChange={setSelectedCategories} />
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
