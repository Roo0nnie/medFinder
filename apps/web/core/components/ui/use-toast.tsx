"use client"

import { toast as sonnerToast } from "sonner"

type ToastVariant = "default" | "destructive"

type ToastInput = {
	title?: string
	description?: string
	variant?: ToastVariant
}

type ToastFn = (input: ToastInput) => void

export function useToast(): { toast: ToastFn } {
	const toast: ToastFn = ({ title, description, variant = "default" }) => {
		const message = title ?? ""
		const options = description ? { description } : undefined

		if (variant === "destructive") {
			sonnerToast.error(message, options as any)
		} else {
			sonnerToast.success(message, options as any)
		}
	}

	return { toast }
}

