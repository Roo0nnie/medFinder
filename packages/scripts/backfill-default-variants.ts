/**
 * One-off backfill: link pharmacy_inventory rows with variant_id NULL to a new
 * medical_product_variants row per product (label "Standard", unit "piece"),
 * sort_order before existing variants).
 *
 * Run from repo root: pnpm -F @repo/scripts run backfill-default-variants
 * Requires: DATABASE_URL (packages/db/.env)
 */
import "./load-env"

import { randomUUID } from "crypto"

import { and, eq, isNull, sql } from "drizzle-orm"

import { createDBClient } from "@repo/db/client"
import { medicalProductVariants, pharmacyInventory } from "@repo/db/schema"

async function main() {
	const db = createDBClient()

	const nullInv = await db
		.select({ productId: pharmacyInventory.productId })
		.from(pharmacyInventory)
		.where(isNull(pharmacyInventory.variantId))

	const productIds = [...new Set(nullInv.map(r => r.productId))]

	if (productIds.length === 0) {
		console.log("No pharmacy_inventory rows with null variant_id. Nothing to do.")
		return
	}

	let created = 0
	const now = new Date()

	for (const productId of productIds) {
		const label = "Standard"

		const [minRow] = await db
			.select({ m: sql<number | null>`min(${medicalProductVariants.sortOrder})` })
			.from(medicalProductVariants)
			.where(eq(medicalProductVariants.productId, productId))

		const minSort = minRow?.m
		const sortOrder = minSort != null ? Number(minSort) - 1 : 0

		const variantId = randomUUID()

		await db.insert(medicalProductVariants).values({
			id: variantId,
			productId,
			label,
			unit: "piece",
			sortOrder,
			createdAt: now,
			updatedAt: now,
		})

		await db
			.update(pharmacyInventory)
			.set({ variantId, updatedAt: now })
			.where(and(eq(pharmacyInventory.productId, productId), isNull(pharmacyInventory.variantId)))

		created += 1
		console.log(`Product ${productId}: created variant ${variantId} (${label}) and linked null inventory.`)
	}

	console.log(`Done. Created ${created} default variant(s).`)
}

main().catch(err => {
	console.error(err)
	process.exit(1)
})
