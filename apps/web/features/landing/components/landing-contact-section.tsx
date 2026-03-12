"use client"

import { useInView } from "@/core/hooks/use-in-view"

export function LandingContactSection() {
	const { ref, isInView } = useInView<HTMLDivElement>()

	return (
		<div ref={ref} className="mx-auto max-w-2xl">
			<div
				className={`rounded-2xl border border-border bg-card p-8 sm:p-12 text-center transition-all duration-700 ${
					isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
				}`}
			>
				<div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
					<svg className="h-7 w-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={1.5}
							d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
						/>
					</svg>
				</div>
				<h2 className="text-3xl font-semibold tracking-tight">Get in touch</h2>
				<p className="text-muted-foreground mt-2 text-base">
					Questions, partnerships, or feedback — we&apos;d love to hear from you.
				</p>
				<a
					href="mailto:support@medfinder.example"
					className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-105 active:scale-95"
				>
					<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
					</svg>
					support@medfinder.example
				</a>
			</div>
		</div>
	)
}
