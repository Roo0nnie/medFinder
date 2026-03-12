"use client"

import { useEffect, useRef, useState } from "react"

interface UseInViewOptions {
	threshold?: number
	rootMargin?: string
	/** If true the visible state resets when the element leaves the viewport. Default: false (trigger once). */
	triggerOnce?: boolean
}

/**
 * Lightweight Intersection Observer hook. Returns a ref to attach and a boolean
 * indicating if the element is (or was) in the viewport.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
	options: UseInViewOptions = {}
) {
	const { threshold = 0.15, rootMargin = "0px", triggerOnce = true } = options
	const ref = useRef<T>(null)
	const [isInView, setIsInView] = useState(false)

	useEffect(() => {
		const el = ref.current
		if (!el) return

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting) {
					setIsInView(true)
					if (triggerOnce) observer.unobserve(el)
				} else if (!triggerOnce) {
					setIsInView(false)
				}
			},
			{ threshold, rootMargin }
		)

		observer.observe(el)
		return () => observer.disconnect()
	}, [threshold, rootMargin, triggerOnce])

	return { ref, isInView }
}
