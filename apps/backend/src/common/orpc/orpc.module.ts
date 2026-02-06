import { Module } from "@nestjs/common"
import { REQUEST } from "@nestjs/core"
import { ORPCModule } from "@orpc/nest"
import { experimental_RethrowHandlerPlugin as RethrowHandlerPlugin } from "@orpc/server/plugins"
import { Request } from "express"

declare module "@orpc/nest" {
	interface ORPCGlobalContext {
		request: Request
	}
}

@Module({
	imports: [
		ORPCModule.forRoot({
			interceptors: [
				// Log errors (optional)
				// (error) => {
				// 	console.error("oRPC Error:", error)
				// }),
			],
			context: { request: REQUEST as unknown as Request },
			customJsonSerializers: [],
			plugins: [
				new RethrowHandlerPlugin({
					filter: error => {
						// Rethrow all non-ORPCError errors
						// This allows unhandled exceptions to bubble up to NestJS global exception filters
						return !(error instanceof Error)
					},
				}),
			],
		}),
	],
})
export class ORPCCommonModule {}
