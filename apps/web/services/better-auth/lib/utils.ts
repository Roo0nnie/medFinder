const LOCAL_APP_ORIGIN = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:8001"

function normalizeOrigin(value: string | undefined): string | null {
	const trimmed = value?.trim().replace(/\/+$/, "")
	if (!trimmed || trimmed === "undefined" || trimmed === "null") return null

	const candidate = /^[a-z][a-z\d+\-.]*:\/\//i.test(trimmed)
		? trimmed
		: trimmed.startsWith("localhost") || /^\d{1,3}(\.\d{1,3}){3}(:\d+)?$/.test(trimmed)
			? `http://${trimmed}`
			: `https://${trimmed}`

	try {
		const url = new URL(candidate)
		return url.protocol === "http:" || url.protocol === "https:" ? url.origin : null
	} catch {
		return null
	}
}

export function getAppOrigin(): string {
	const configuredOrigin = normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL)
	if (configuredOrigin) return configuredOrigin

	if (typeof window !== "undefined" && window.location.origin) {
		return window.location.origin
	}

	return (
		normalizeOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
		normalizeOrigin(process.env.VERCEL_BRANCH_URL) ??
		normalizeOrigin(process.env.VERCEL_URL) ??
		LOCAL_APP_ORIGIN
	)
}

export function getAuthUrl(): string {
	return `${getAppOrigin()}/api/auth`
}
