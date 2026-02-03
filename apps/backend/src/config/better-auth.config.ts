import { Logger, type INestApplication } from "@nestjs/common"
import type { OpenAPIObject } from "@nestjs/swagger"
import type { IncomingMessage, ServerResponse } from "http"
import { toNodeHandler } from "better-auth/node"

import { AUTH_BASE_PATH, getAuth } from "@repo/auth"

import { VERSION_MODULES } from "@/config/versions.config"
import { generateBetterAuthSchema } from "@/utils/openapi"

const logger = new Logger("BetterAuthConfig")

type NextFunction = () => void

/**
 * Create a middleware that handles versioned auth paths
 * Rewrites /api/v1/auth/ok -> /auth/ok for Better Auth processing
 */
function createAuthMiddleware(versionedAuthPaths: string[]) {
	const handler = toNodeHandler(getAuth())

	return (req: IncomingMessage, res: ServerResponse, next: NextFunction) => {
		const url = req.url ?? ""

		// Find matching versioned auth path
		const matchedPath = versionedAuthPaths.find(authPath => url.startsWith(authPath))

		if (matchedPath) {
			// Rewrite /api/v1/auth/ok -> /auth/ok for Better Auth
			req.url = url.replace(matchedPath, AUTH_BASE_PATH)
			return handler(req, res)
		}

		// Not an auth route, continue to next middleware
		next()
	}
}

/**
 * Set up Better Auth routes and endpoints for all registered versions
 * Routes are registered at /api/v1/auth/*, /api/v2/auth/*, etc.
 */
export function setupBetterAuth(app: INestApplication): void {
	const httpServer = app.getHttpAdapter().getInstance()
	const versions = Object.keys(VERSION_MODULES).sort()

	// Collect all versioned auth paths
	const authPaths = versions.map(version => `/api/${version}/auth`)

	// Register single middleware that handles all versioned auth routes
	httpServer.use(createAuthMiddleware(authPaths))

	// Register OpenAPI schema endpoints for each version
	for (const version of versions) {
		const authPath = `/api/${version}/auth`

		httpServer.get(
			`${authPath}/open-api`,
			async (_: unknown, res: { json: (body: OpenAPIObject) => void }) => {
				res.json(await generateBetterAuthSchema())
			}
		)

		logger.log(`Better Auth routes registered at ${authPath}/*`)
	}
}
