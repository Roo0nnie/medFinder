import "reflect-metadata"

import { VersioningType, type PipeTransform } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import { ZodValidationPipe } from "nestjs-zod"

import { setupOpenApi } from "@/common/docs/openapi"
import { AppModule } from "@/main.module"

async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		// Disable body parser to allow Better Auth to handle raw request body
		// The library will automatically re-add the default body parsers
		bodyParser: false,
	})
	app.setGlobalPrefix("api")
	app.enableVersioning({
		type: VersioningType.URI,
		defaultVersion: "1",
	})
	app.useGlobalPipes(new ZodValidationPipe() as PipeTransform)

	// Configure OpenAPI / Scalar docs
	setupOpenApi(app)

	await app.listen(process.env.PORT ?? 3000)
}

bootstrap().catch(error => {
	console.error(error)
	process.exit(1)
})
