import { redirect } from "next/navigation"

import { getSession } from "@/services/better-auth/auth-server"
import { LandingAboutSection } from "@/features/landing/components/landing-about-section"
import { LandingContactSection } from "@/features/landing/components/landing-contact-section"
import { LandingFooterNav } from "@/features/landing/components/landing-footer-nav"
import { LandingHero } from "@/features/landing/components/landing-hero"
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
				<div className={containerClass}>
					<LandingHero />
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
				<div className={containerClass}>
					<LandingAboutSection />
				</div>
			</section>

			{/* Contact */}
			<section id="contact" className={sectionClass}>
				<div className={containerClass}>
					<LandingContactSection />
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
