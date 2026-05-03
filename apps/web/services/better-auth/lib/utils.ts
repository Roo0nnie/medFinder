import { cache } from "react"

import { env } from "@/env"

export const getAuthUrl = cache(() => {
	return `${env.NEXT_PUBLIC_APP_URL}/api/auth`
})
