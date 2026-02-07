"use client"

import { dehydrate, HydrationBoundary } from "@tanstack/react-query"

import { getQueryClient } from "@/services/tanstack-query/query-client"

import { sessionKeys, sessionOptions } from "../api/session.hooks"

export async function ServerSession() {
	const queryClient = getQueryClient()
	await queryClient.prefetchQuery(sessionOptions())

	const session = queryClient.getQueryData(sessionKeys.all)

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<div>
				<p className="text-sm font-medium">Server Session</p>
				<pre className="text-xs">{JSON.stringify(session, null, 2)}</pre>
			</div>
		</HydrationBoundary>
	)
}
