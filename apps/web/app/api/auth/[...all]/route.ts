import { toNextJsHandler } from "better-auth/next-js"

import { auth } from "@/services/better-auth/auth"

/**
 * Better Auth API route handler
 * Handles all authentication requests under /api/auth/*
 */
export const { GET, POST } = toNextJsHandler(auth)
