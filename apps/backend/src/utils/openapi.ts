import type { OpenAPIObject } from "@nestjs/swagger"

import { getAuth } from "@repo/auth"

/** Human-friendly operation summaries for Better Auth endpoints */
const AUTH_OPERATION_SUMMARIES: Record<string, string> = {
	"/sign-in/email": "Sign In (Email)",
	"/sign-in/social": "Sign In (Social)",
	"/sign-up/email": "Sign Up (Email)",
	"/sign-out": "Sign Out",
	"/get-session": "Get Session",
	"/list-sessions": "List Sessions",
	"/revoke-session": "Revoke Session",
	"/revoke-sessions": "Revoke All Sessions",
	"/revoke-other-sessions": "Revoke Other Sessions",
	"/update-user": "Update User",
	"/delete-user": "Delete User",
	"/delete-user/callback": "Delete User Callback",
	"/change-password": "Change Password",
	"/change-email": "Change Email",
	"/verify-email": "Verify Email",
	"/send-verification-email": "Send Verification Email",
	"/request-password-reset": "Request Password Reset",
	"/reset-password": "Reset Password",
	"/reset-password/{token}": "Reset Password (Token)",
	"/verify-password": "Verify Password",
	"/link-social": "Link Social Account",
	"/unlink-account": "Unlink Account",
	"/list-accounts": "List Accounts",
	"/account-info": "Account Info",
	"/refresh-token": "Refresh Token",
	"/get-access-token": "Get Access Token",
	"/ok": "Health Check",
	"/error": "Error",
}

/** Generate Better Auth OpenAPI schema */
export async function generateBetterAuthSchema(): Promise<OpenAPIObject> {
	const api = getAuth().api as unknown as { generateOpenAPISchema: () => Promise<OpenAPIObject> }
	return api.generateOpenAPISchema()
}

/** Merge Better Auth schema into main OpenAPI document with prefixed paths and friendly names */
export async function mergeBetterAuthSchema(baseDoc: OpenAPIObject): Promise<OpenAPIObject> {
	try {
		const betterAuthSchema = await generateBetterAuthSchema()
		const oldTag = "Default"
		const newTag = "Auth"

		// Update tags
		const updatedTags = betterAuthSchema.tags?.map(tag =>
			tag.name === oldTag ? { ...tag, name: newTag } : tag
		) ?? [{ name: newTag, description: "Authentication endpoints" }]

		// Transform paths: add /api/auth prefix and friendly summaries
		const prefixedPaths: OpenAPIObject["paths"] = {}

		for (const [path, methods] of Object.entries(betterAuthSchema.paths ?? {})) {
			const prefixedPath = `/api/auth${path}`
			const summary = AUTH_OPERATION_SUMMARIES[path]

			const updatedMethods: Record<string, object> = {}
			for (const [method, op] of Object.entries(methods ?? {})) {
				if (!op || typeof op !== "object") continue
				updatedMethods[method] = {
					...op,
					summary: summary ?? path.replace(/^\//, "").replace(/-/g, " "),
					tags: (((op as Record<string, unknown>).tags as string[]) ?? []).map((t: string) =>
						t === oldTag ? newTag : t
					),
				}
			}
			prefixedPaths[prefixedPath] = updatedMethods
		}

		return {
			...baseDoc,
			paths: {
				...(baseDoc.paths ?? {}),
				...prefixedPaths,
			},
			tags: [...(baseDoc.tags ?? []), ...updatedTags],
			components: {
				...(baseDoc.components ?? {}),
				...(betterAuthSchema.components ?? {}),
				schemas: {
					...(baseDoc.components?.schemas ?? {}),
					...(betterAuthSchema.components?.schemas ?? {}),
				},
				securitySchemes: {
					...(baseDoc.components?.securitySchemes ?? {}),
					...(betterAuthSchema.components?.securitySchemes ?? {}),
				},
			},
		}
	} catch (error) {
		console.error("Failed to merge Better Auth OpenAPI schema", error)
		return baseDoc
	}
}
