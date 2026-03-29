import { Clock, Mail, MapPin, Phone } from "lucide-react"

import { cn } from "@/core/lib/utils"

function telHref(phone: string) {
	const digits = phone.replace(/[^\d+]/g, "")
	return digits ? `tel:${digits}` : `tel:${phone.trim()}`
}

export type PharmacyLocationDetailsProps = {
	addressLine: string
	operatingHours?: string | null
	phone?: string | null
	email?: string | null
	className?: string
	/** Section title above the card */
	heading?: string
	/** When false, only the inner card is rendered (e.g. hero strip) */
	showHeading?: boolean
}

export function PharmacyLocationDetails({
	addressLine,
	operatingHours,
	phone,
	email,
	className,
	heading = "Details",
	showHeading = true,
}: PharmacyLocationDetailsProps) {
	const hasAny =
		addressLine.trim() ||
		operatingHours?.trim() ||
		phone?.trim() ||
		email?.trim()

	if (!hasAny) {
		return null
	}

	const inner = (
		<div className="border-border/50 bg-muted/25 space-y-4 rounded-xl border p-4 sm:p-5">
			
			{operatingHours?.trim() ? (
				<div className="flex gap-3">
					<Clock className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
					<div className="min-w-0">
						<p className="text-muted-foreground mb-0.5 text-xs font-medium uppercase tracking-wide">
							Hours
						</p>
						<p className="text-foreground text-sm leading-relaxed">{operatingHours.trim()}</p>
					</div>
				</div>
			) : null}
			{phone?.trim() ? (
				<div className="flex gap-3">
					<Phone className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
					<a
						href={telHref(phone)}
						className="text-primary hover:text-primary/80 text-sm font-medium underline-offset-4 hover:underline focus-visible:ring-ring rounded-sm focus-visible:ring-2 focus-visible:outline-none"
					>
						{phone.trim()}
					</a>
				</div>
			) : null}
			{email?.trim() ? (
				<div className="flex gap-3">
					<Mail className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
					<a
						href={`mailto:${email.trim()}`}
						className="text-muted-foreground hover:text-foreground text-sm break-all underline-offset-4 hover:underline focus-visible:ring-ring rounded-sm focus-visible:ring-2 focus-visible:outline-none"
					>
						{email.trim()}
					</a>
				</div>
			) : null}
			{addressLine.trim() ? (
				<div className="flex gap-3">
					<MapPin className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
					<p className="text-foreground text-sm leading-relaxed sm:text-[0.9375rem]">{addressLine}</p>
				</div>
			) : null}
		</div>
	)

	if (!showHeading) {
		return <div className={cn("flex min-h-0 flex-col", className)}>{inner}</div>
	}

	return (
		<div className={cn("flex min-h-0 flex-col", className)}>
			<h2 className="text-foreground mb-4 text-lg font-semibold tracking-tight">{heading}</h2>
			{inner}
		</div>
	)
}
