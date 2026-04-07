"use client"

import { Card, CardContent } from "@/core/components/ui/card"
import { OwnerBrandsSection } from "@/features/products/components/owner-brands-section"

export default function OwnerProductsBrandPage() {
	return (
		<div className="space-y-6">
			<Card>
				<CardContent className="p-4 sm:p-6">
					<OwnerBrandsSection />
				</CardContent>
			</Card>
		</div>
	)
}
