import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { Observable } from "rxjs"
import { map } from "rxjs/operators"

import { serialize } from "@repo/contracts"

import { RESPONSE_MESSAGE_KEY } from "@/common/decorators/response-message.decorator"

@Injectable()
export class ResponseWrapperInterceptor implements NestInterceptor {
	constructor(private readonly reflector: Reflector) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		// Get custom message from decorator (if exists)
		const customMessage = this.reflector.get<string>(RESPONSE_MESSAGE_KEY, context.getHandler())

		return next.handle().pipe(
			map(data => {
				// If already wrapped (has 'success' property), return as-is
				// This allows for backward compatibility during migration
				if (data && typeof data === "object" && "success" in data) {
					// Override message if decorator exists
					if (customMessage) {
						return { ...data, message: customMessage }
					}
					return data
				}

				// Support returning { data, message } from controller for dynamic messages
				if (data && typeof data === "object" && "data" in data && "message" in data) {
					return {
						success: true,
						data: serialize(data.data),
						message: data.message,
					}
				}

				// Wrap and serialize raw data
				const wrapped = {
					success: true,
					data: serialize(data),
				}

				// Add custom message if decorator exists
				if (customMessage) {
					return { ...wrapped, message: customMessage }
				}

				return wrapped
			})
		)
	}
}
