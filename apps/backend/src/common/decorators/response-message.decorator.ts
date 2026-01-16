import { SetMetadata } from "@nestjs/common"

export const RESPONSE_MESSAGE_KEY = "response_message"

/**
 * Decorator to set a custom success message for the response
 * @param message - The custom success message
 * @example
 * @Post()
 * @ResponseMessage("Todo created successfully")
 * async createTodo(@Body() payload: CreateTodoDto) {
 *   return this.todosService.create(payload)
 * }
 */
export const ResponseMessage = (message: string) => SetMetadata(RESPONSE_MESSAGE_KEY, message)
