import type { Route } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { Button } from "@/core/components/ui/button"
import { Card, CardContent } from "@/core/components/ui/card"
import { getSession } from "@/services/better-auth/auth-server"
import { LandingFooterNav } from "@/features/landing/components/landing-footer-nav"
import { LandingPharmacySection } from "@/features/landing/components/landing-pharmacy-section"
import { LandingProductSection } from "@/features/landing/components/landing-product-section"

const DASHBOARD_ROLES = ["admin", "owner", "staff"] as const

export default async function Home() {
	const session = await getSession()

	const userRole = (session?.user as { role?: string } | undefined)?.role
	if (userRole && DASHBOARD_ROLES.includes(userRole as (typeof DASHBOARD_ROLES)[number])) {
		redirect("/dashboard")
	}

	const sectionClass = "scroll-mt-24 w-full min-h-screen flex items-center"
	const sectionContentClass = "scroll-mt-24 w-full flex flex-col py-12"
	const containerClass = "mx-auto w-full max-w-7xl px-4 py-12 sm:px-8"

	return (
		<>
			{/* Home / Hero */}
			<section id="home" className={sectionClass}>
				<div
					className={`${containerClass} grid items-center gap-10 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]`}
				>
					<div className="space-y-6">
						<h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl">
							Find the right pharmacy
							<span className="text-primary block">for every medication.</span>
						</h1>
						<p className="text-muted-foreground max-w-xl text-base text-balance sm:text-lg">
							MedFinder helps patients and providers quickly discover nearby pharmacies, check
							availability, and keep treatments on track.
						</p>
						<div className="flex flex-wrap items-center gap-3">
							<Link href={"/login" as Route}>
								<Button size="lg">Get started</Button>
							</Link>
							<a
								href="#find-product"
								className="text-primary text-sm font-medium underline-offset-4 hover:underline"
							>
								Find products
							</a>
							<a
								href="#pharmacy"
								className="text-muted-foreground text-sm font-medium underline-offset-4 hover:underline"
							>
								Browse pharmacies
							</a>
						</div>
						<p className="text-muted-foreground text-xs">
							Designed for patients, caregivers, and clinics who need trusted pharmacy partners.
						</p>
					</div>
					<div className="max-w-md justify-self-center md:justify-self-end">
						<Card className="border-primary/20 from-primary/5 via-background to-primary/10 bg-linear-to-br shadow-sm">
							<CardContent className="space-y-4 p-6">
								<p className="text-primary text-sm font-medium">Why MedFinder?</p>
								<ul className="text-muted-foreground space-y-3 text-sm">
									<li>• Discover pharmacies that stock the medications your patients need.</li>
									<li>• Reduce time spent calling multiple locations.</li>
									<li>• Build a trusted network of pharmacy partners.</li>
								</ul>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* Find Product */}
			<section id="find-product" className={sectionContentClass}>
				<div className={containerClass}>
					<LandingProductSection
						isCustomer={(session?.user as { role?: string } | undefined)?.role === "customer"}
					/>
				</div>
			</section>

			{/* Pharmacy */}
			<section id="pharmacy" className={sectionContentClass}>
				<div className={containerClass}>
					<LandingPharmacySection
						isCustomer={(session?.user as { role?: string } | undefined)?.role === "customer"}
					/>
				</div>
			</section>

			{/* About */}
			<section id="about" className={sectionClass}>
				<div className={`${containerClass} max-w-3xl space-y-4`}>
					<h2 className="text-3xl font-semibold tracking-tight">About MedFinder</h2>
					<p className="text-muted-foreground text-base">
						MedFinder is built to make it easier for patients, caregivers, and clinics to connect
						with reliable pharmacies. Instead of calling multiple locations, you get a clearer view
						of where medications are most likely to be available.
					</p>
					<p className="text-muted-foreground text-base">
						The platform is designed to fit into existing clinical workflows, helping care teams
						reduce administrative burden while keeping focus on patients.
					</p>
				</div>
			</section>

			{/* Contact */}
			<section id="contact" className={sectionClass}>
				<div className={`${containerClass} max-w-3xl space-y-4`}>
					<h2 className="text-3xl font-semibold tracking-tight">Contact</h2>
					<p className="text-muted-foreground text-base">
						Have questions about MedFinder, or interested in collaborating as a pharmacy or
						healthcare partner?
					</p>
					<p className="text-muted-foreground text-base">
						Reach the team at{" "}
						<a
							href="mailto:support@medfinder.example"
							className="text-primary font-medium underline-offset-4 hover:underline"
						>
							support@medfinder.example
						</a>{" "}
						for product feedback, support, or partnership discussions.
					</p>
				</div>
			</section>

			{/* Footer */}
			<footer className="text-muted-foreground bg-muted/30 w-full border-t px-4 py-6 text-sm sm:px-8">
				<div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<span>© {new Date().getFullYear()} MedFinder. All rights reserved.</span>
					<LandingFooterNav />
				</div>
			</footer>
		</>
	)
}
