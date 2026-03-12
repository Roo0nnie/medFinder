import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
	const url = request.nextUrl.clone()

	// Only protect dashboard routes
	if (!url.pathname.startsWith("/dashboard")) {
		return NextResponse.next()
	}

	// Forward cookies to this app's Better Auth /get-session endpoint
	const authUrl = new URL("/api/auth/get-session", request.url)

	const cookieHeader = request.headers.get("cookie") ?? ""

	const sessionResponse = await fetch(authUrl.toString(), {
		headers: {
			"Content-Type": "application/json",
			cookie: cookieHeader,
		},
		cache: "no-store",
	})

	if (!sessionResponse.ok) {
		url.pathname = "/login"
		return NextResponse.redirect(url)
	}

	const session = (await sessionResponse.json()) as {
		user?: { role?: string }
	} | null

	if (!session || !session.user) {
		url.pathname = "/login"
		return NextResponse.redirect(url)
	}

	const role = session.user.role

	// Role-based route protection
	if (url.pathname.startsWith("/dashboard/admin") && role !== "admin") {
		url.pathname =
			role === "owner"
				? "/dashboard/owner"
				: role === "staff"
					? "/dashboard/staff"
					: "/"
		return NextResponse.redirect(url)
	}

	if (url.pathname.startsWith("/dashboard/owner") && role !== "owner") {
		url.pathname =
			role === "admin"
				? "/dashboard/admin"
				: role === "staff"
					? "/dashboard/staff"
					: "/"
		return NextResponse.redirect(url)
	}

	if (url.pathname.startsWith("/dashboard/staff") && role !== "staff") {
		url.pathname =
			role === "admin"
				? "/dashboard/admin"
				: role === "owner"
					? "/dashboard/owner"
					: "/"
		return NextResponse.redirect(url)
	}

	return NextResponse.next()
}

export const config = {
	matcher: ["/dashboard/:path*"],
}

