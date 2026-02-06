/**
 * Generic date field transformer for any entity
 * Useful for entities with multiple date fields
 */
export function transformDateFields<
	T extends Record<string, string | Date | unknown>,
	K extends keyof T,
>(obj: T, dateFields: K[]): T {
	const result = { ...obj }
	for (const field of dateFields) {
		if (typeof result[field] === "string") {
			result[field] = new Date(result[field] as string) as T[K]
		}
	}
	return result
}

/**
 * Transform an array of entities with date fields
 */
export function transformDateFieldsArray<
	T extends Record<string, string | Date | unknown>,
	K extends keyof T,
>(items: T[], dateFields: K[]): T[] {
	return items.map(item => transformDateFields(item, dateFields))
}

/**
 * Type-safe transformation for objects with date string fields to Date objects
 * Use when you need explicit type conversion from string dates to Date objects
 */
export function transformToDateFields<
	TInput extends Record<string, unknown>,
	TOutput extends Record<string, unknown>,
>(obj: TInput, dateFields: (keyof TInput)[]): TOutput {
	const result = { ...obj } as Record<string, unknown>
	for (const field of dateFields) {
		const key = field as string
		if (typeof result[key] === "string") {
			result[key] = new Date(result[key] as string)
		}
	}
	return result as unknown as TOutput
}

/**
 * Type-safe transformation for arrays with date string fields to Date objects
 */
export function transformToDateFieldsArray<
	TInput extends Record<string, unknown>,
	TOutput extends Record<string, unknown>,
>(items: TInput[], dateFields: (keyof TInput)[]): TOutput[] {
	return items.map(item => transformToDateFields<TInput, TOutput>(item, dateFields))
}
