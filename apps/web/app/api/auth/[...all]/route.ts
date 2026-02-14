import { toNextJsHandler } from "better-auth/next-js"

import { getAuth } from "@repo/auth"

export const { GET, POST } = toNextJsHandler(getAuth())
