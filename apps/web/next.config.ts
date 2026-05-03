import "dotenv/config"

import type { NextConfig } from "next"

import "./env"

if (process.env.VERCEL === "1" && !process.env.BACKEND_PROXY_URL?.trim()) {
	throw new Error(
		"BACKEND_PROXY_URL must be set in Vercel project env (Django base URL, no trailing slash, e.g. https://your-api.onrender.com). " +
			"Otherwise /api/v1/* is not proxied and the app returns 404.",
	)
}

/** @type {import("next").NextConfig} */
const config: NextConfig = {
	typedRoutes: true,
	output: "standalone",

	/** Enables hot reloading for local packages without a build step */
	transpilePackages: [
		"@repo/auth",
		"@repo/backend",
		"@repo/contracts",
		"@repo/db",
		"@t3-oss/env-core",
		"@t3-oss/env-nextjs",
	],

	typescript: { ignoreBuildErrors: true },
	reactCompiler: true,
	skipTrailingSlashRedirect: true,

	devIndicators: {
		position: "bottom-right",
	},

	/**
	 * When BACKEND_PROXY_URL is set, browser calls stay on this app origin
	 * (NEXT_PUBLIC_API_BASE_URL should be `${NEXT_PUBLIC_APP_URL}/api`) so
	 * Better Auth cookies are sent; Next forwards the request to Django with
	 * the Cookie header. Without this, calling Django on another host (e.g.
	 * Render) never includes those cookies → 403 on IsAuthenticated routes.
	 */
	async rewrites() {
		const backend = process.env.BACKEND_PROXY_URL?.trim().replace(/\/$/, "")
		if (!backend) return []
		return {
			beforeFiles: [{ source: "/api/v1/:path*", destination: `${backend}/api/v1/:path*/` }],
		}
	},
}

export default config
