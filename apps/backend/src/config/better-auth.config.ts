import { Logger, type INestApplication } from "@nestjs/common"
import type { OpenAPIObject } from "@nestjs/swagger"
import type { IncomingMessage, ServerResponse } from "http"
import { toNodeHandler } from "better-auth/node"

import { AUTH_BASE_PATH, getAuth } from "@repo/auth"

import { VERSION_MODULES } from "@/config/versions.config"
import { generateBetterAuthSchema } from "@/utils/openapi"

const logger = new Logger("BetterAuthConfig")

interface JsonResponse {
	json: (body: OpenAPIObject) => void
}

/**
 * Creates middleware that routes versioned auth paths to Better Auth
 *
 * Rewrites URLs like /api/v1/auth/ok -> /auth/ok before passing to Better Auth handler.
 * This allows the same Better Auth instance to handle all API versions.
 */
function createAuthMiddleware(versionedAuthPaths: string[]) {
	const handler = toNodeHandler(getAuth())

	return (req: IncomingMessage, res: ServerResponse, next: () => void) => {
		const url = req.url ?? ""
		const matchedPath = versionedAuthPaths.find(path => url.startsWith(path))

		if (matchedPath) {
			req.url = url.replace(matchedPath, AUTH_BASE_PATH)
			return handler(req, res)
		}

		next()
	}
}

/**
 * Registers OpenAPI documentation endpoint for auth routes
 */
function registerAuthOpenApiEndpoint(httpServer: any, authPath: string): void {
	httpServer.get(`${authPath}/open-api`, async (_: unknown, res: JsonResponse) => {
		res.json(await generateBetterAuthSchema())
	})
}

/**
 * Set up Better Auth routes for all registered API versions
 *
 * Routes are registered at /api/v1/auth/*, /api/v2/auth/*, etc.
 * All versions share the same Better Auth instance with URL rewriting.
 */
export function setupBetterAuth(app: INestApplication): void {
	const httpServer = app.getHttpAdapter().getInstance()
	const versions = Object.keys(VERSION_MODULES).sort()
	const authPaths = versions.map(version => `/api/${version}/auth`)

	// Single middleware handles all versioned auth routes
	httpServer.use(createAuthMiddleware(authPaths))

	// Register OpenAPI endpoints for each version
	for (const authPath of authPaths) {
		registerAuthOpenApiEndpoint(httpServer, authPath)
		logger.log(`Auth routes registered at ${authPath}/*`)
	}
}
