import "server-only"

import { createORPCClient } from "@orpc/client"

import type { OrpcClient } from "./orpc-client"
import { createOrpcLink } from "./orpc-link"

const link = createOrpcLink()

const globalClient = globalThis as typeof globalThis & {
	$orpc?: OrpcClient
}

globalClient.$orpc = createORPCClient<OrpcClient>(link)
