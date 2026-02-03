import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common"
import { Observable } from "rxjs"
import { map } from "rxjs/operators"

import { serialize } from "@repo/contracts"

@Injectable()
export class ResponseWrapperInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		return next.handle().pipe(
			map(data => {
				// If already wrapped (has 'success' property), return as-is
				if (data && typeof data === "object" && "success" in data) {
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
				return {
					success: true,
					data: serialize(data),
				}
			})
		)
	}
}
