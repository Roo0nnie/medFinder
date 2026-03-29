import { cn } from "@/core/lib/utils"

export type PharmacyStorefrontMetaProps = {
	address: string
	city: string
	state: string
	zipCode?: string
	country?: string
	municipality?: string | null
	heading?: string
	className?: string
}

export function formatPharmacyAddressLine(
	p: Pick<
		PharmacyStorefrontMetaProps,
		"address" | "city" | "state" | "zipCode" | "country" | "municipality"
	>
): string {
	const parts = [
		p.address.trim(),
		p.municipality?.trim(),
		p.city.trim(),
		p.state.trim(),
		p.zipCode?.trim(),
		p.country?.trim(),
	].filter(Boolean)
	return parts.join(", ")
}

export function PharmacyStorefrontMeta({
	address,
	city,
	state,
	zipCode,
	country,
	municipality,
	heading = "Location",
	className,
}: PharmacyStorefrontMetaProps) {
	const line = formatPharmacyAddressLine({
		address,
		city,
		state,
		zipCode,
		country,
		municipality,
	})

	return (
		<section
			className={cn(
				"animate-in fade-in slide-in-from-bottom-4 border-border/50 border-t pt-10 text-center duration-500",
				className
			)}
		>
			<h2 className="text-foreground text-xl font-semibold tracking-tight sm:text-2xl">{heading}</h2>
			<p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-base leading-relaxed">{line}</p>
		</section>
	)
}
