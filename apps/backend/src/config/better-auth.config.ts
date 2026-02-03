import { Logger, type INestApplication } from "@nestjs/common"
import type { OpenAPIObject } from "@nestjs/swagger"
import { toNodeHandler } from "better-auth/node"

import { getAuth } from "@repo/auth"

import { env } from "@/config/env.config"
import { generateBetterAuthSchema } from "@/utils/openapi"

const logger = new Logger("BetterAuthConfig")

/**
 * Set up Better Auth routes and endpoints
 */
export function setupBetterAuth(app: INestApplication): void {
	const httpServer = app.getHttpAdapter().getInstance()
	const authPath = `/api/${env.API_VERSION}/auth`

	httpServer.all(`${authPath}/*splat`, toNodeHandler(getAuth()))
	httpServer.get(
		`${authPath}/open-api`,
		async (_: unknown, res: { json: (body: OpenAPIObject) => void }) => {
			res.json(await generateBetterAuthSchema())
		}
	)

	logger.log(`Better Auth routes registered at ${authPath}`)
}
