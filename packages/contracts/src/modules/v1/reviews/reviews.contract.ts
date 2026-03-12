import { oc } from "@orpc/contract"
import { z } from "zod"

import {
	PharmacyReviewSchema,
	ProductReviewSchema,
	CreatePharmacyReviewSchema,
	CreateProductReviewSchema,
	PharmacyReviewSearchSchema,
	ProductReviewSearchSchema,
	ReviewIdSchema,
} from "./reviews.schema.js"

export const reviewsContract = {
	/**
	 * List pharmacy reviews
	 * GET /reviews/pharmacies
	 */
	listPharmacy: oc
		.route({
			method: "GET",
			path: "/reviews/pharmacies",
			summary: "List pharmacy reviews",
			description: "Retrieve pharmacy reviews with optional filters",
			tags: ["Reviews"],
		})
		.input(PharmacyReviewSearchSchema.partial())
		.output(z.array(PharmacyReviewSchema)),

	/**
	 * Get a single pharmacy review by ID
	 * GET /reviews/pharmacies/{id}
	 */
	getPharmacy: oc
		.route({
			method: "GET",
			path: "/reviews/pharmacies/{id}",
			summary: "Get pharmacy review by ID",
			description: "Retrieve a single pharmacy review",
			tags: ["Reviews"],
		})
		.input(ReviewIdSchema)
		.output(PharmacyReviewSchema),

	/**
	 * Create a new pharmacy review
	 * POST /reviews/pharmacies
	 */
	createPharmacy: oc
		.route({
			method: "POST",
			path: "/reviews/pharmacies",
			summary: "Create pharmacy review",
			description: "Create a new review for a pharmacy",
			tags: ["Reviews"],
		})
		.input(CreatePharmacyReviewSchema)
		.output(PharmacyReviewSchema),

	/**
	 * List product reviews
	 * GET /reviews/products
	 */
	listProduct: oc
		.route({
			method: "GET",
			path: "/reviews/products",
			summary: "List product reviews",
			description: "Retrieve product reviews with optional filters",
			tags: ["Reviews"],
		})
		.input(ProductReviewSearchSchema.partial())
		.output(z.array(ProductReviewSchema)),

	/**
	 * Get a single product review by ID
	 * GET /reviews/products/{id}
	 */
	getProduct: oc
		.route({
			method: "GET",
			path: "/reviews/products/{id}",
			summary: "Get product review by ID",
			description: "Retrieve a single product review",
			tags: ["Reviews"],
		})
		.input(ReviewIdSchema)
		.output(ProductReviewSchema),

	/**
	 * Create a new product review
	 * POST /reviews/products
	 */
	createProduct: oc
		.route({
			method: "POST",
			path: "/reviews/products",
			summary: "Create product review",
			description: "Create a new review for a product",
			tags: ["Reviews"],
		})
		.input(CreateProductReviewSchema)
		.output(ProductReviewSchema),
}

