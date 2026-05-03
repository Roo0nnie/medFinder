import { toNextJsHandler } from "better-auth/next-js"

import { getAuth } from "@repo/auth"

const authHandler = toNextJsHandler((request) => getAuth().handler(request))

export const { GET, POST } = authHandler
