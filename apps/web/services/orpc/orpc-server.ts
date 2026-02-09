import "server-only"

import { createORPCClient } from "@orpc/client"

import { getCookieHeader } from "@/core/lib/cookie-utils"

import type { OrpcClient } from "./orpc-client"
import { createOrpcLink } from "./orpc-link"

const link = createOrpcLink({ getCookieHeader })

const globalClient = globalThis as typeof globalThis & {
	$orpc?: OrpcClient
}

globalClient.$orpc = createORPCClient<OrpcClient>(link)
