import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import { env } from "@/env"

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function getAppUrl() {
	return env.NEXT_PUBLIC_APP_URL
}

export function getApiUrl() {
	return `${env.NEXT_PUBLIC_API_BASE_URL}/${env.NEXT_PUBLIC_API_VERSION}`
}
