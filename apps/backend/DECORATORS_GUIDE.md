# NestJS Swagger Decorators Best Practices Guide

## Current Setup Analysis

You're using **nestjs-zod** with Zod schemas, which automatically generates OpenAPI schemas from your Zod definitions.

### ⚠️ Important: Two Decorators Needed for Responses

For response documentation, you need **both** decorators:

1. **`@ZodSerializerDto(TodoResponseDto)`** - Handles runtime validation and serialization
2. **`@ApiResponse({ type: TodoResponseDto })`** - Registers the type in OpenAPI/Swagger documentation

**Why both?**
- `@ZodSerializerDto` validates and serializes responses at runtime using your Zod schema
- `@ApiResponse` with `type` tells Swagger/OpenAPI what the response structure looks like for documentation
- They serve different purposes and both are required for proper type-safe responses with complete documentation

---

## Essential Decorators (What You Need)

### 1. **@ApiTags()** ✅ Keep
**Purpose**: Groups endpoints in Swagger UI
```typescript
@ApiTags("Todos")
@Controller("todos")
export class TodosController {}
```

### 2. **@ApiOperation()** ✅ Keep
**Purpose**: Describes what the endpoint does
```typescript
@ApiOperation({ 
  summary: "Get all todos",
  description: "Retrieves a paginated list of todos" // Optional but recommended
})
```

### 3. **@ApiResponse()** ✅ Required for OpenAPI Documentation
**Important**: `@ZodSerializerDto` handles runtime serialization, but you still need `@ApiResponse` with `type` for OpenAPI documentation!

**Correct usage:**
```typescript
@ZodSerializerDto(TodoResponseDto)
@ApiResponse({
  status: 200,
  description: "Todo found",
  type: TodoResponseDto, // Required for OpenAPI type documentation
})
```

**Why both?**
- `@ZodSerializerDto(TodoResponseDto)` - Validates and serializes the response at runtime
- `@ApiResponse({ type: TodoResponseDto })` - Registers the response type in OpenAPI/Swagger documentation

**Document ALL responses:**
```typescript
@ZodSerializerDto(TodoResponseDto)
@ApiResponse({ 
  status: 200, 
  description: "Todo found",
  type: TodoResponseDto 
})
@ApiResponse({ status: 404, description: "Todo not found" })
@ApiResponse({ status: 400, description: "Invalid request" })
```

### 4. **@ZodSerializerDto()** ✅ Keep
**Purpose**: Validates and serializes response using Zod schema at runtime
```typescript
@ZodSerializerDto(TodoResponseDto)
```
This automatically:
- Validates the response matches the schema at runtime
- Serializes the response according to the Zod schema

**Note**: This does NOT automatically register the type in Swagger/OpenAPI. You still need `@ApiResponse({ type: TodoResponseDto })` for documentation.

### 5. **@ApiParam()** ✅ Keep for Path Parameters
**Purpose**: Documents path parameters
```typescript
@ApiParam({ 
  name: "id", 
  type: Number, 
  description: "Todo ID",
  example: 1 
})
```

### 6. **@ApiQuery()** ⚠️ Missing - Add This!
**Purpose**: Documents query parameters
```typescript
@Get()
@ApiQuery({ 
  name: "page", 
  type: Number, 
  required: false,
  description: "Page number",
  example: 1 
})
@ApiQuery({ 
  name: "limit", 
  type: Number, 
  required: false,
  example: 20 
})
async getTodos(@Query() query: PaginationDto) {}
```

### 7. **@ApiBody()** ⚠️ Usually Redundant with Zod
**With nestjs-zod**: Usually not needed because `@Body()` with Zod DTO auto-discovers

**Only use if:**
- You need custom examples
- You want to override the default description

```typescript
@ApiBody({
  description: "Todo creation payload",
  examples: {
    example1: {
      value: { title: "My todo", completed: false }
    }
  }
})
async createTodo(@Body() payload: CreateTodoDto) {}
```

---

## Advanced Decorators (Good to Know)

### 8. **@ApiBearerAuth()** 🔐 For Authentication
**Purpose**: Documents that endpoint requires authentication
```typescript
@ApiBearerAuth()
@Get("profile")
async getProfile() {}
```

**Setup in openapi.ts:**
```typescript
const swaggerConfig = new DocumentBuilder()
  .addBearerAuth() // Add this
  .build()
```

### 9. **@ApiSecurity()** 🔐 For Custom Auth Schemes
```typescript
@ApiSecurity("api-key")
```

### 10. **@ApiConsumes()** / **@ApiProduces()**
**Purpose**: Document content types
```typescript
@ApiConsumes("application/json", "multipart/form-data")
@ApiProduces("application/json")
```

### 11. **@ApiExcludeEndpoint()** / **@ApiExcludeController()**
**Purpose**: Hide endpoints/controllers from Swagger
```typescript
@ApiExcludeEndpoint()
@Get("internal")
async internalEndpoint() {}
```

### 12. **@ApiExtraModels()**
**Purpose**: Explicitly register models that aren't auto-discovered
```typescript
@ApiExtraModels(SomeDto)
@Controller()
export class MyController {}
```

### 13. **@ApiHeader()**
**Purpose**: Document required headers
```typescript
@ApiHeader({
  name: "X-Custom-Header",
  description: "Custom header",
  required: true
})
```

### 14. **@ApiOkResponse()**, **@ApiCreatedResponse()**, etc.
**Purpose**: Shorthand for common responses
```typescript
@ApiOkResponse({ type: TodoResponseDto })
@ApiCreatedResponse({ type: TodoResponseDto })
@ApiNotFoundResponse({ description: "Todo not found" })
@ApiBadRequestResponse({ description: "Invalid input" })
```

---

## Best Practices for Your Zod Setup

### ✅ DO:

1. **Use Zod schemas as source of truth**
   - Define schemas in `packages/contracts/src`
   - Use `createZodDto()` to create DTOs
   - Let Zod generate OpenAPI schemas automatically

2. **Document all response codes with types**
   ```typescript
   @ZodSerializerDto(TodoResponseDto)
   @ApiOkResponse({ type: TodoResponseDto, description: "Success" })
   @ApiNotFoundResponse({ description: "Todo not found" })
   @ApiBadRequestResponse({ description: "Invalid ID format" })
   ```

3. **Add descriptions to Zod schemas** (better than decorators!)
   ```typescript
   export const CreateTodoSchema = z.object({
     title: z.string().min(1).max(255).describe("Todo title"),
     completed: z.boolean().optional().describe("Completion status")
   })
   ```

4. **Use @ApiOperation for summaries**
   ```typescript
   @ApiOperation({ 
     summary: "Create todo",
     description: "Creates a new todo item. Title is required."
   })
   ```

5. **Group related endpoints with @ApiTags**
   ```typescript
   @ApiTags("Todos")
   @Controller("todos")
   ```

### ❌ DON'T:

1. **Always include type in @ApiResponse**
   ```typescript
   // ❌ BAD - missing type, OpenAPI won't show response schema
   @ZodSerializerDto(TodoResponseDto)
   @ApiResponse({ status: 200, description: "Success" })
   
   // ✅ GOOD - both decorators needed
   @ZodSerializerDto(TodoResponseDto)
   @ApiResponse({ status: 200, description: "Success", type: TodoResponseDto })
   ```

2. **Don't use @ApiProperty in Zod DTOs**
   - Zod schemas already define everything
   - Use `.describe()` on Zod fields instead

3. **Don't forget error responses**
   - Document 400, 404, 500, etc.

---

## Recommended Controller Pattern

```typescript
@ApiTags("Todos")
@Controller({ path: "examples/todos", version: "1" })
export class TodosController {
  @Get()
  @ApiOperation({ 
    summary: "Get all todos",
    description: "Retrieves a paginated list of todos"
  })
  @ApiQuery({ name: "page", type: Number, required: false, example: 1 })
  @ApiQuery({ name: "limit", type: Number, required: false, example: 20 })
  @ZodSerializerDto(TodoListResponseDto)
  @ApiOkResponse({ type: TodoListResponseDto, description: "List of todos" })
  @ApiBadRequestResponse({ description: "Invalid query parameters" })
  async getTodos(@Query() query: PaginationDto) {}

  @Get(":id")
  @ApiOperation({ summary: "Get a todo by ID" })
  @ApiParam({ name: "id", type: Number, description: "Todo ID", example: 1 })
  @ZodSerializerDto(TodoResponseDto)
  @ApiOkResponse({ type: TodoResponseDto, description: "Todo found" })
  @ApiNotFoundResponse({ description: "Todo not found" })
  @ApiBadRequestResponse({ description: "Invalid ID format" })
  async getTodo(@Param("id") id: string) {}

  @Post()
  @ApiOperation({ summary: "Create a new todo" })
  @ZodSerializerDto(TodoResponseDto)
  @ApiCreatedResponse({ type: TodoResponseDto, description: "Todo created successfully" })
  @ApiBadRequestResponse({ description: "Invalid input data" })
  async createTodo(@Body() payload: CreateTodoDto) {}
}
```

---

## Summary: What to Use

| Decorator | When to Use | Priority |
|-----------|-------------|----------|
| `@ApiTags()` | Always - group endpoints | ⭐⭐⭐ |
| `@ApiOperation()` | Always - describe endpoint | ⭐⭐⭐ |
| `@ZodSerializerDto()` | Always - for responses | ⭐⭐⭐ |
| `@ApiResponse()` | Always - document status codes | ⭐⭐⭐ |
| `@ApiParam()` | When using path params | ⭐⭐⭐ |
| `@ApiQuery()` | When using query params | ⭐⭐ |
| `@ApiOkResponse()` | Shorthand for 200 responses | ⭐⭐ |
| `@ApiCreatedResponse()` | Shorthand for 201 responses | ⭐⭐ |
| `@ApiNotFoundResponse()` | Document 404 errors | ⭐⭐ |
| `@ApiBadRequestResponse()` | Document 400 errors | ⭐⭐ |
| `@ApiBearerAuth()` | If using JWT/auth | ⭐⭐ |
| `@ApiBody()` | Only if need custom examples | ⭐ |
| `@ApiExcludeEndpoint()` | Hide internal endpoints | ⭐ |

---

## Quick Reference: Common Patterns

### Pattern 1: Simple GET
```typescript
@Get(":id")
@ApiOperation({ summary: "Get by ID" })
@ApiParam({ name: "id", type: Number })
@ZodSerializerDto(ResponseDto)
@ApiOkResponse({ type: ResponseDto })
@ApiNotFoundResponse()
```

### Pattern 2: POST with Body
```typescript
@Post()
@ApiOperation({ summary: "Create" })
@ZodSerializerDto(ResponseDto)
@ApiCreatedResponse({ type: ResponseDto })
@ApiBadRequestResponse()
```

### Pattern 3: GET with Query
```typescript
@Get()
@ApiOperation({ summary: "List" })
@ApiQuery({ name: "page", type: Number, required: false })
@ZodSerializerDto(ListResponseDto)
@ApiOkResponse({ type: ListResponseDto })
```

### Pattern 4: Protected Endpoint
```typescript
@Get("profile")
@ApiBearerAuth()
@ApiOperation({ summary: "Get profile" })
@ZodSerializerDto(ProfileDto)
@ApiOkResponse({ type: ProfileDto })
@ApiUnauthorizedResponse()
```
