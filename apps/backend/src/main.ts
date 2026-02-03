import "dotenv/config"
import "reflect-metadata"

import { Logger, ValidationPipe, VersioningType, type INestApplication } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from "@nestjs/swagger"
import { apiReference } from "@scalar/nestjs-api-reference"
import { toNodeHandler } from "better-auth/node"
import { cleanupOpenApiDoc } from "nestjs-zod"

import { getAuth } from "@repo/auth"

import { MainModule } from "@/app.module"
import { env } from "@/config/env.config"
import { V1Module } from "@/modules/v1/v1.module"
import { generateBetterAuthSchema, mergeBetterAuthSchema } from "@/utils/openapi"

type VersionModule = typeof V1Module

const VERSION_MODULES: Record<string, VersionModule> = {
	v1: V1Module,
}

const logger = new Logger("Bootstrap")

function discoverVersions(): string[] {
	return Object.keys(VERSION_MODULES).sort()
}

async function setupVersionedDocs(app: INestApplication, version: string): Promise<void> {
	const versionModule = VERSION_MODULES[version]
	if (!versionModule) {
		logger.warn(`No module found for version ${version}`)
		return
	}

	try {
		const baseOpenApiDoc = SwaggerModule.createDocument(
			app,
			new DocumentBuilder()
				.setTitle(`API Documentation ${version}`)
				.setDescription(`Type-safe API with auto-generated documentation for version ${version}`)
				.setVersion(version)
				.addServer(`/api/${version}`)
				.build(),
			{ include: [versionModule] }
		) as OpenAPIObject

		const mergedOpenApiDoc = await mergeBetterAuthSchema(baseOpenApiDoc)
		const swaggerPath = `api/${version}`

		SwaggerModule.setup(swaggerPath, app, cleanupOpenApiDoc(mergedOpenApiDoc) as OpenAPIObject)

		app.use(`/${swaggerPath}/docs`, apiReference({ content: mergedOpenApiDoc, theme: "none" }))

		logger.log(`Documentation set up for version ${version} at /${swaggerPath}`)
	} catch (error) {
		logger.error(`Failed to set up documentation for version ${version}`, error)
		throw error
	}
}

function configureCors(app: INestApplication): void {
	app.enableCors({
		origin: env.CORS_ORIGINS.split(","),
		credentials: true,
	})
	logger.log("CORS enabled")
}

function configureApiVersioning(app: INestApplication): void {
	app.setGlobalPrefix("api")
	app.enableVersioning({ type: VersioningType.URI, defaultVersion: env.API_VERSION })
	logger.log(`API versioning enabled with default version: ${env.API_VERSION}`)
}

async function setupAllDocumentation(app: INestApplication): Promise<void> {
	const versions = discoverVersions()
	if (versions.length === 0) {
		logger.warn("No version modules found")
		return
	}

	const versionsList = versions.join(", ")
	logger.log(`Setting up documentation for ${versions.length} version(s): ${versionsList}`)

	for (const version of versions) {
		await setupVersionedDocs(app, version)
	}
}

function setupBetterAuthRoutes(app: INestApplication): void {
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

function configureGlobalPipes(app: INestApplication): void {
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
		})
	)
	logger.log("Global validation pipe configured")
}

function enableGracefulShutdown(app: INestApplication): void {
	const gracefulShutdown = async (signal: string): Promise<void> => {
		logger.log(`Received ${signal}. Starting graceful shutdown...`)

		try {
			await app.close()
			logger.log("Application closed successfully")
			process.exit(0)
		} catch (error) {
			logger.error("Error during graceful shutdown", error)
			process.exit(1)
		}
	}

	process.on("SIGTERM", () => void gracefulShutdown("SIGTERM"))
	process.on("SIGINT", () => void gracefulShutdown("SIGINT"))

	logger.log("Graceful shutdown enabled")
}

async function createApplication(): Promise<INestApplication> {
	logger.log("Creating NestJS application...")
	const app = await NestFactory.create(MainModule, { bodyParser: false })

	configureCors(app)
	configureGlobalPipes(app)
	configureApiVersioning(app)
	setupBetterAuthRoutes(app)
	await setupAllDocumentation(app)

	return app
}

async function startApplication(app: INestApplication): Promise<void> {
	const port = env.PORT
	await app.listen(port)

	logger.log(`Application is running on: http://localhost:${port}`)
	logger.log(`Environment: ${env.NODE_ENV}`)
	logger.log(`API version: ${env.API_VERSION}`)
}

async function bootstrap(): Promise<void> {
	try {
		const app = await createApplication()
		enableGracefulShutdown(app)
		await startApplication(app)
	} catch (error) {
		logger.error("Failed to bootstrap application", error)
		process.exit(1)
	}
}

void bootstrap()
