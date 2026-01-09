import { ValidationPipe, VersioningType, type INestApplication } from "@nestjs/common"
import { Test, type TestingModule } from "@nestjs/testing"
import request from "supertest"
import { type App } from "supertest/types"

import { MainModule } from "@/app.module"
import { DB } from "@/common/database/database.providers"

describe("Health (e2e)", () => {
	let app: INestApplication<App>

	beforeEach(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [MainModule],
		})
			.overrideProvider(DB)
			.useValue({
				execute: jest.fn(async () => [] as any[]),
			})
			.compile()

		app = moduleFixture.createNestApplication()
		app.setGlobalPrefix("api")
		app.enableVersioning({
			type: VersioningType.URI,
			defaultVersion: "1",
		})
		app.useGlobalPipes(
			new ValidationPipe({
				whitelist: true,
				forbidNonWhitelisted: true,
				transform: true,
			})
		)
		await app.init()
	})

	it("/api/health (GET)", async () => {
		const response = await request(app.getHttpServer()).get("/api/health").expect(200)
		expect(response.body.status).toBe("ok")
		expect(response.body.checks.database.status).toBe("up")
		expect(response.body.checks.cache.status).toBe("not_configured")
		expect(typeof response.body.uptime).toBe("number")
		expect(response.body.timestamp).toBeDefined()
		expect(response.body.version).toBeDefined()
	})
})
