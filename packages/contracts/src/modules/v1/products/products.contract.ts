import { oc } from "@orpc/contract"
import { z } from "zod"

import {
	MedicalProductSchema,
	CreateProductSchema,
	UpdateProductSchema,
	ProductSearchSchema,
	ProductIdSchema,
	CategorySchema,
} from "./products.schema.js"

export const productsContract = {
	/**
	 * List all products with search/filter
	 * GET /products
	 */
	list: oc
		.route({
			method: "GET",
			path: "/products",
			summary: "List products",
			description: "Retrieve all products with optional search and filters",
			tags: ["Products"],
		})
		.input(ProductSearchSchema.partial())
		.output(z.array(MedicalProductSchema)),

	/**
	 * Get a single product by ID
	 * GET /products/{id}
	 */
	get: oc
		.route({
			method: "GET",
			path: "/products/{id}",
			summary: "Get product by ID",
			description: "Retrieve a single product with all details",
			tags: ["Products"],
		})
		.input(ProductIdSchema)
		.output(MedicalProductSchema),

	/**
	 * Create a new product
	 * POST /products
	 */
	create: oc
		.route({
			method: "POST",
			path: "/products",
			summary: "Create product",
			description: "Create a new medical product (admin only)",
			tags: ["Products"],
		})
		.input(CreateProductSchema)
		.output(MedicalProductSchema),

	/**
	 * Update an existing product
	 * PUT /products/{id}
	 */
	update: oc
		.route({
			method: "PUT",
			path: "/products/{id}",
			summary: "Update product",
			description: "Update an existing product (admin only)",
			tags: ["Products"],
		})
		.input(ProductIdSchema.extend(UpdateProductSchema.shape))
		.output(MedicalProductSchema),

	/**
	 * Delete a product by ID
	 * DELETE /products/{id}
	 */
	delete: oc
		.route({
			method: "DELETE",
			path: "/products/{id}",
			summary: "Delete product",
			description: "Delete a product (admin only)",
			tags: ["Products"],
		})
		.input(ProductIdSchema)
		.output(z.object({ success: z.boolean(), id: z.string() })),

	/**
	 * List all categories
	 * GET /categories
	 */
	listCategories: oc
		.route({
			method: "GET",
			path: "/categories",
			summary: "List categories",
			description: "Retrieve all product categories with hierarchy",
			tags: ["Products"],
		})
		.output(z.array(CategorySchema)),

	/**
	 * Create a new category
	 * POST /categories
	 */
	createCategory: oc
		.route({
			method: "POST",
			path: "/categories",
			summary: "Create category",
			description: "Create a new product category (admin only)",
			tags: ["Products"],
		})
		.input(
			z.object({
				name: z.string().min(1),
				description: z.string().optional(),
				parentCategoryId: z.string().optional(),
			})
		)
		.output(CategorySchema),

	/**
	 * Update a category
	 * PUT /categories/{id}
	 */
	updateCategory: oc
		.route({
			method: "PUT",
			path: "/categories/{id}",
			summary: "Update category",
			description: "Update an existing category (admin only)",
			tags: ["Products"],
		})
		.input(
			z.object({
				id: z.string(),
				name: z.string().optional(),
				description: z.string().optional(),
				parentCategoryId: z.string().optional(),
			})
		)
		.output(CategorySchema),

	/**
	 * Delete a category
	 * DELETE /categories/{id}
	 */
	deleteCategory: oc
		.route({
			method: "DELETE",
			path: "/categories/{id}",
			summary: "Delete category",
			description: "Delete a category (admin only)",
			tags: ["Products"],
		})
		.input(z.object({ id: z.string() }))
		.output(z.object({ success: z.boolean(), id: z.string() })),
}
