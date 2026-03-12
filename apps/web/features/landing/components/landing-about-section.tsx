"use client"

import { useInView } from "@/core/hooks/use-in-view"

const FEATURES = [
	{
		icon: (
			<svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
			</svg>
		),
		title: "Instant Search",
		description: "Find medications across pharmacies in seconds.",
	},
	{
		icon: (
			<svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
			</svg>
		),
		title: "Verified Partners",
		description: "Trusted, licensed pharmacy network you can rely on.",
	},
	{
		icon: (
			<svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
			</svg>
		),
		title: "Built for Clinics",
		description: "Fits right into existing clinical workflows.",
	},
] as const

export function LandingAboutSection() {
	const { ref, isInView } = useInView<HTMLDivElement>()

	return (
		<div ref={ref} className="max-w-5xl mx-auto space-y-8">
			<div className={`space-y-2 transition-all duration-700 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
				<h2 className="text-3xl font-semibold tracking-tight">About MedFinder</h2>
				<p className="text-muted-foreground text-base max-w-2xl">
					Connecting patients, caregivers, and clinics with reliable pharmacies — no more endless calls.
				</p>
			</div>
			<div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
				{FEATURES.map((feature, i) => (
					<div
						key={feature.title}
						className={`group rounded-2xl border border-border bg-card p-6 transition-all duration-700 hover:shadow-lg hover:border-primary/20 hover:-translate-y-1 ${
							isInView
								? "opacity-100 translate-y-0"
								: "opacity-0 translate-y-6"
						}`}
						style={{ transitionDelay: isInView ? `${(i + 1) * 150}ms` : "0ms" }}
					>
						<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
							{feature.icon}
						</div>
						<h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
						<p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
					</div>
				))}
			</div>
		</div>
	)
}
