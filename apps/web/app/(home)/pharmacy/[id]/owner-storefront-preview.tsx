"use client"

import { useEffect } from "react"

export function OwnerStorefrontPreview() {
	useEffect(() => {
		document.body.classList.add("owner-storefront-preview")
		return () => document.body.classList.remove("owner-storefront-preview")
	}, [])

	return null
}

