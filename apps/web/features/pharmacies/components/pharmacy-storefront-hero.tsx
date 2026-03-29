"use client"

import { useState } from "react"
import { Building2, Clock, ExternalLink, Mail, MapPin, Navigation, Phone, Star } from "lucide-react"

import { Badge } from "@/core/components/ui/badge"
import { Button } from "@/core/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/core/components/ui/dialog"
import { PharmacyLocationDetails } from "@/features/pharmacies/components/pharmacy-location-details"
import { cn } from "@/core/lib/utils"

const SPACE = {
	card: "gap-6 p-6 sm:p-8",
	section: "gap-4 sm:gap-5",
} as const

export type PharmacyStorefrontHeroProps = {
	name: string
	description?: string | null
	subtitleFallback?: string | null
	ownerImage?: string | null
	logo?: string | null
	addressLine: string
	phone?: string | null
	email?: string | null
	website?: string | null
	operatingHours?: string | null
	/** Google Maps embed URL — when set, "View on map" opens a modal with the map. */
	mapEmbedUrl?: string | null
	externalMapUrl?: string | null
	isActive?: boolean
	showStatusBadge?: boolean
	rating?: { value: number | null; reviewCount?: number } | null
	showNoReviewsYet?: boolean
	actions?: React.ReactNode
	showEmptyImageHint?: boolean
	hideLocationDetails?: boolean
	productCount?: number
	className?: string
}

function telHref(phone: string) {
	const digits = phone.replace(/[^\d+]/g, "")
	return digits ? `tel:${digits}` : `tel:${phone.trim()}`
}

function normalizeWebsiteUrl(url: string) {
	const t = url.trim()
	if (!t) return ""
	return /^https?:\/\//i.test(t) ? t : `https://${t}`
}

/** Splits prose into lines of at most `wordsPerLine` words (new line after each chunk). */
function splitDescriptionIntoWordLines(text: string, wordsPerLine = 9): string[] {
	const words = text.trim().split(/\s+/).filter(Boolean)
	if (words.length === 0) return []
	const lines: string[] = []
	for (let i = 0; i < words.length; i += wordsPerLine) {
		lines.push(words.slice(i, i + wordsPerLine).join(" "))
	}
	return lines
}

function RatingFloatingCard({
	ratingValue,
	reviewCount,
	showNoReviewsYet,
}: {
	ratingValue: number | null
	reviewCount: number
	showNoReviewsYet: boolean
}) {
	const hasRating = ratingValue != null && !Number.isNaN(ratingValue)

	return (
		<div
			className={cn(
				"border-border/50 bg-background/95 max-w-[16rem] rounded-xl border p-4 shadow-lg backdrop-blur-md",
				"dark:border-white/10 dark:bg-black/55"
			)}
		>
			<p className="text-muted-foreground mb-2 text-[0.65rem] font-semibold uppercase tracking-wider">
				Store rating
			</p>
			{hasRating ? (
				<>
					<div className="mb-2 flex items-center gap-0.5" aria-hidden>
						{[1, 2, 3, 4, 5].map(star => (
							<Star
								key={star}
								className={cn(
									"size-4 sm:size-[1.125rem]",
									star <= Math.round(ratingValue!)
										? "fill-amber-400 text-amber-500"
										: "text-muted-foreground/25"
								)}
							/>
						))}
					</div>
					<div className="flex flex-wrap items-baseline gap-2">
						<span className="text-foreground text-3xl font-bold tabular-nums">{ratingValue!.toFixed(1)}</span>
						<span className="text-muted-foreground text-xs">/ 5</span>
					</div>
					{reviewCount > 0 ? (
						<a
							href="#pharmacy-reviews"
							className="text-primary mt-2 inline-block text-xs font-medium hover:underline"
						>
							{reviewCount} review{reviewCount !== 1 ? "s" : ""}
						</a>
					) : (
						<p className="text-muted-foreground mt-1 text-xs">No written reviews yet</p>
					)}
				</>
			) : showNoReviewsYet ? (
				<p className="text-muted-foreground text-sm">No ratings yet — leave the first review after your visit.</p>
			) : null}
		</div>
	)
}

function ProductCountFloatingCard({ count }: { count: number }) {
	if (count <= 0) return null
	return (
		<div
			className={cn(
				"border-border/50 bg-background/95 flex max-w-[14rem] items-start gap-3 rounded-xl border p-4 shadow-lg backdrop-blur-md",
				"dark:border-white/10 dark:bg-black/55"
			)}
		>
			<div className="bg-primary/15 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg text-lg font-bold">
				{count > 99 ? "99+" : count}
			</div>
			<div>
				<p className="text-muted-foreground text-[0.65rem] font-semibold uppercase tracking-wider">
					Products
				</p>
				<p className="text-foreground mt-0.5 text-sm font-semibold leading-snug">
					Listed for this pharmacy
				</p>
				<a href="#pharmacy-products" className="text-primary mt-1 text-xs font-medium hover:underline">
					Shop below →
				</a>
			</div>
		</div>
	)
}

function PharmacyInformationCard({
	addressLine,
	phone,
	email,
}: {
	addressLine: string
	phone?: string | null
	email?: string | null
}) {
	const hasAny = Boolean(
		addressLine.trim() || phone?.trim() || email?.trim()
	)
	if (!hasAny) return null

	return (
		<div
			className="text-foreground flex flex-col gap-0"
			role="region"
			aria-label="Location and contact"
		>
			<div className="space-y-5">
				
				{phone?.trim() || email?.trim() ? (
					<div className="flex flex-row flex-wrap items-start gap-x-8 gap-y-4 sm:gap-x-10 lg:gap-x-14">
						{phone?.trim() ? (
							<div className="flex min-w-0 flex-1 gap-3 sm:gap-4">
								<Phone className="text-primary mt-0.5 size-5 shrink-0" strokeWidth={2} aria-hidden />
								<div className="min-w-0 space-y-1">
									<a
										href={telHref(phone)}
										className="text-primary text-sm font-medium underline-offset-4 hover:underline"
									>
										{phone.trim()}
									</a>
								</div>
							</div>
						) : null}
						{email?.trim() ? (
							<div className="flex min-w-0 flex-1 gap-3 sm:gap-4">
								<Mail className="text-primary mt-0.5 size-5 shrink-0" strokeWidth={2} aria-hidden />
								<div className="min-w-0 space-y-1">
									<a
										href={`mailto:${email.trim()}`}
										className="text-muted-foreground hover:text-foreground text-sm break-all underline-offset-4 hover:underline"
									>
										{email.trim()}
									</a>
								</div>
							</div>
						) : null}
					</div>
				) : null}
				{addressLine.trim() ? (
					<div className="flex gap-3 sm:gap-4">
						<MapPin className="text-primary mt-0.5 size-5 shrink-0" strokeWidth={2} aria-hidden />
						<div className="min-w-0 space-y-1">
							<p className="text-muted-foreground text-sm leading-relaxed sm:text-[0.9375rem]">
								{addressLine.trim()}
							</p>
						</div>
					</div>
				) : null}
			</div>
		</div>
	)
}

export function PharmacyStorefrontHero({
	name,
	description,
	subtitleFallback,
	ownerImage,
	logo,
	addressLine,
	phone,
	email,
	website,
	operatingHours,
	mapEmbedUrl,
	externalMapUrl,
	isActive = true,
	showStatusBadge = false,
	rating,
	showNoReviewsYet = false,
	actions,
	showEmptyImageHint = false,
	hideLocationDetails = false,
	productCount,
	className,
}: PharmacyStorefrontHeroProps) {
	const [descExpanded, setDescExpanded] = useState(false)
	const [mapDialogOpen, setMapDialogOpen] = useState(false)

	const fullDescription = (description?.trim() || subtitleFallback?.trim() || "") as string
	const descriptionLines = splitDescriptionIntoWordLines(fullDescription, 9)
	const descriptionNeedsToggle = fullDescription.length > 140

	const heroImageSrc = ownerImage?.trim() || logo?.trim() || null
	const hasOwnerToolbar = Boolean(actions)
	const useSpotlightLayout = Boolean(hideLocationDetails && !hasOwnerToolbar)

	const trimmedLogo = logo?.trim()
	const logoHeaderSrc =
		trimmedLogo &&
		(hasOwnerToolbar ||
			Boolean(ownerImage?.trim() && trimmedLogo !== ownerImage.trim()))
			? trimmedLogo
			: null

	const mapEmbed = mapEmbedUrl?.trim() || null
	const mapExternal = externalMapUrl?.trim() || null
	/** Iframe src: lat/lng embed from API, or address-based embed when only search URL exists. */
	const mapIframeSrc =
		mapEmbed ||
		(!mapEmbed && mapExternal && addressLine.trim()
			? `https://www.google.com/maps?q=${encodeURIComponent(addressLine.trim())}&output=embed`
			: null)
	const showMapModal = Boolean(mapIframeSrc)
	const showDirectionsLinkOnly = Boolean(mapExternal && !mapIframeSrc)

	const hasRating = rating?.value != null && !Number.isNaN(rating.value)
	const reviewCount = rating?.reviewCount ?? 0
	const ratingValue = hasRating ? Number(rating?.value) : null

	const mapCtaHero =
		showMapModal ? (
			<Button
				type="button"
				size="default"
				className="h-11 min-w-[10rem] rounded-full px-6 font-semibold sm:h-10"
				onClick={() => setMapDialogOpen(true)}
			>
				<Navigation data-icon="inline-start" />
				View on map
			</Button>
		) : showDirectionsLinkOnly ? (
			<Button
				size="default"
				className="h-11 min-w-[10rem] rounded-full px-6 font-semibold sm:h-10"
				nativeButton={false}
				render={<a href={mapExternal!} target="_blank" rel="noopener noreferrer" />}
			>
				<Navigation data-icon="inline-start" />
				Directions
			</Button>
		) : null

	const mapCtaCompact =
		showMapModal ? (
			<Button
				type="button"
				size="sm"
				className="w-full sm:w-auto"
				onClick={() => setMapDialogOpen(true)}
			>
				<Navigation data-icon="inline-start" />
				View on map
			</Button>
		) : showDirectionsLinkOnly ? (
			<Button
				size="sm"
				className="w-full sm:w-auto"
				nativeButton={false}
				render={<a href={mapExternal!} target="_blank" rel="noopener noreferrer" />}
			>
				<Navigation data-icon="inline-start" />
				Directions
			</Button>
		) : null

	const hasPharmacyInfoBlock =
		Boolean(hideLocationDetails) &&
		Boolean(addressLine.trim() || phone?.trim() || email?.trim())

	const showOperatingHoursInHero =
		Boolean(hideLocationDetails) && Boolean(operatingHours?.trim())

	return (
		<section
			className={cn(
				"animate-in fade-in slide-in-from-bottom-4 duration-500",
				className
			)}
			aria-labelledby="pharmacy-storefront-title"
		>
			<div
				className={cn(
					"border-border/60 bg-card/40 shadow-sm backdrop-blur-sm",
					"rounded-2xl border",
					"overflow-hidden"
				)}
			>
				<div
					className={cn(
						"grid grid-cols-1",
						"lg:grid-cols-2 lg:items-stretch"
					)}
				>
					{/* Copy column — headline hierarchy like landing hero */}
					<div className="flex min-h-0 flex-col lg:h-full">
						{logoHeaderSrc ? (
							<div className="border-border/30 shrink-0 border-b px-6 pt-6 pb-4 sm:px-8 sm:pt-8 sm:pb-5">
								<div className="flex justify-start">
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img
										src={logoHeaderSrc}
										alt={`${name} logo`}
										className="border-border/40 size-14 rounded-xl border bg-white/95 object-contain p-2 shadow-sm dark:bg-muted/90 sm:size-16"
									/>
								</div>
							</div>
						) : null}

						<div
							className={cn(
								"flex min-h-0 flex-1 flex-col",
								hasPharmacyInfoBlock ? "justify-between gap-8" : "justify-center gap-8",
								useSpotlightLayout ? "px-6 py-8 sm:px-10 sm:py-10 lg:py-12" : cn(SPACE.section, logoHeaderSrc ? "gap-6 px-6 pb-6 sm:px-8 sm:pb-8" : SPACE.card)
							)}
						>
							<div className="min-w-0 space-y-5">
								<div className="space-y-3">
									<div className="flex flex-wrap items-center gap-3">
										<h1
											id="pharmacy-storefront-title"
											className={cn(
												"text-foreground font-bold tracking-tight",
												useSpotlightLayout
													? "text-4xl leading-[1.1] sm:text-5xl lg:text-6xl"
													: "text-3xl sm:text-4xl lg:text-5xl"
											)}
										>
											{name}
										</h1>
										{showStatusBadge ? (
											<Badge
												variant={isActive ? "default" : "secondary"}
												className={cn(
													"rounded-full px-2.5 py-0.5 text-xs font-medium",
													isActive
														? "bg-emerald-600 text-white hover:bg-emerald-600/90"
														: "bg-muted text-muted-foreground"
												)}
											>
												{isActive ? "Active" : "Inactive"}
											</Badge>
										) : null}
									</div>

									{/* Rating: inline only when not using floating cards */}
									{!useSpotlightLayout && hasRating && ratingValue != null ? (
										<div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4" aria-label={`Rating ${ratingValue.toFixed(1)} out of 5`}>
											<div className="flex items-center gap-0.5" aria-hidden>
												{[1, 2, 3, 4, 5].map(star => (
													<Star
														key={star}
														className={cn(
															"size-4.5 sm:size-5",
															star <= Math.round(ratingValue)
																? "fill-amber-400 text-amber-500"
																: "text-muted-foreground/25"
														)}
													/>
												))}
											</div>
											<div className="flex flex-wrap items-baseline gap-2">
												<span className="text-foreground text-3xl font-bold tabular-nums sm:text-4xl">
													{ratingValue.toFixed(1)}
												</span>
												<span className="text-muted-foreground text-sm">out of 5</span>
												{reviewCount > 0 ? (
													<a
														href="#pharmacy-reviews"
														className="text-primary text-sm font-medium underline-offset-4 hover:underline"
													>
														{reviewCount} customer review{reviewCount !== 1 ? "s" : ""}
													</a>
												) : (
													<span className="text-muted-foreground text-sm">(no written reviews yet)</span>
												)}
											</div>
										</div>
									) : !useSpotlightLayout && showNoReviewsYet ? (
										<p className="text-muted-foreground text-sm">
											No ratings yet — be the first to review after your visit.
										</p>
									) : null}

									{fullDescription ? (
										<div className="space-y-2">
											<p
												className={cn(
													"text-muted-foreground leading-relaxed",
													useSpotlightLayout
														? "text-base sm:text-lg lg:max-w-xl"
														: "text-sm sm:text-base",
													!descExpanded && descriptionNeedsToggle && "line-clamp-3"
												)}
											>
												{descriptionLines.map((line, i) => (
													<span key={i}>
														{i > 0 ? <br /> : null}
														{line}
													</span>
												))}
											</p>
											{descriptionNeedsToggle ? (
												<button
													type="button"
													className="text-primary text-sm font-medium underline-offset-4 hover:underline focus-visible:ring-ring rounded-sm focus-visible:ring-2 focus-visible:outline-none"
													onClick={() => setDescExpanded(e => !e)}
													aria-expanded={descExpanded}
												>
													{descExpanded ? "Show less" : "Read more"}
												</button>
											) : null}
										</div>
									) : null}


									{/* CTAs — directly under description */}
									<div className="flex flex-col gap-4 pt-1 sm:flex-row sm:flex-wrap sm:items-center">
										{useSpotlightLayout ? (
											<>
												{mapCtaHero}
												<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
													{phone?.trim() ? (
														<Button
															variant="outline"
															size="default"
															className="h-11 rounded-full border-2 sm:h-10"
															nativeButton={false}
															render={<a href={telHref(phone)} />}
														>
															<Phone data-icon="inline-start" />
															Call
														</Button>
													) : null}
													{website?.trim() ? (
														<Button
															variant="ghost"
															className="text-foreground h-11 font-medium sm:h-10"
															nativeButton={false}
															render={
																<a
																	href={normalizeWebsiteUrl(website)}
																	target="_blank"
																	rel="noopener noreferrer"
																/>
															}
														>
															<ExternalLink data-icon="inline-start" />
															Website
														</Button>
													) : null}
												</div>
											</>
										) : (
											<div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
												{mapCtaCompact}
												{phone?.trim() ? (
													<Button size="sm" variant="outline" nativeButton={false} className="w-full sm:w-auto" render={<a href={telHref(phone)} />}>
														<Phone data-icon="inline-start" />
														Call
													</Button>
												) : null}
												{website?.trim() ? (
													<Button size="sm" variant="ghost" nativeButton={false} className="text-muted-foreground hover:text-foreground w-full sm:w-auto" render={<a href={normalizeWebsiteUrl(website)} target="_blank" rel="noopener noreferrer" />}>
														<ExternalLink data-icon="inline-start" />
														Website
													</Button>
												) : null}
											</div>
										)}
									</div>
									
											{showOperatingHoursInHero ? (
										<div className="flex gap-3 sm:gap-4">
											<Clock
												className="text-primary mt-0.5 size-5 shrink-0"
												strokeWidth={2}
												aria-hidden
											/>
											<div className="min-w-0 space-y-1">
												<p
													className={cn(
														"text-muted-foreground leading-relaxed whitespace-pre-line",
														useSpotlightLayout ? "text-base sm:text-lg" : "text-sm sm:text-base"
													)}
												>
													{operatingHours?.trim()}
												</p>
											</div>
										</div>
									) : null}
								</div>

								{useSpotlightLayout ? (
									<p className="text-muted-foreground max-w-xl text-sm leading-relaxed">
										Browse medicines and supplies in the product list below, and read reviews from
										other customers.
									</p>
								) : null}
							</div>

							{hasPharmacyInfoBlock ? (
								<div className="border-border/40 min-w-0 shrink-0 border-t pt-6 sm:pt-8">
									<PharmacyInformationCard
										addressLine={addressLine}
										phone={phone}
										email={email}
									/>
								</div>
							) : null}

							{!hideLocationDetails ? (
								<PharmacyLocationDetails
									addressLine={addressLine}
									operatingHours={operatingHours}
									phone={phone}
									email={email}
									showHeading={false}
								/>
							) : null}
						</div>
					</div>

					{/* Image column + floating data cards (customer) */}
					<div className="relative flex min-h-48 flex-col justify-center bg-muted/10 lg:min-h-0 lg:h-full dark:bg-muted/5">
						{/* Mobile: show floating cards in flow */}
						{useSpotlightLayout && heroImageSrc ? (
							<div className="flex flex-col gap-3 p-4 pb-0 lg:hidden">
								<RatingFloatingCard
									ratingValue={ratingValue}
									reviewCount={reviewCount}
									showNoReviewsYet={showNoReviewsYet}
								/>
								<ProductCountFloatingCard count={productCount ?? 0} />
							</div>
						) : null}

						{heroImageSrc ? (
							<div className="flex h-full w-full min-h-48 flex-1 items-center justify-center p-4 sm:p-6 lg:min-h-0 lg:p-8">
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img
									src={heroImageSrc}
									alt={`${name} — storefront`}
									className="max-h-[min(28rem,55vh)] w-full max-w-full object-contain object-center lg:max-h-[min(36rem,70vh)]"
								/>
							</div>
						) : (
							<div
								className="flex min-h-48 w-full flex-col items-center justify-center gap-3 p-8 text-center lg:min-h-72"
								role="img"
								aria-label="No pharmacy image"
							>
								<Building2 className="text-muted-foreground/35 size-20 sm:size-24" />
								{showEmptyImageHint ? (
									<p className="text-muted-foreground max-w-xs text-sm">
										Add a logo or storefront image to showcase your pharmacy
									</p>
								) : (
									<p className="text-muted-foreground/80 text-sm">Pharmacy image</p>
								)}
							</div>
						)}

						{/* Desktop: floating cards on image */}
						{useSpotlightLayout && heroImageSrc ? (
							<div className="pointer-events-none absolute inset-0 hidden lg:block">
								<div className="pointer-events-auto absolute top-6 right-6 z-10">
									<RatingFloatingCard
										ratingValue={ratingValue}
										reviewCount={reviewCount}
										showNoReviewsYet={showNoReviewsYet}
									/>
								</div>
								<div className="pointer-events-auto absolute bottom-8 left-6 z-10">
									<ProductCountFloatingCard count={productCount ?? 0} />
								</div>
							</div>
						) : null}

						{actions ? (
							<div className="absolute right-3 bottom-3 z-20 flex max-w-[calc(100%-1.5rem)] flex-col items-end gap-2 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-2">
								{actions}
							</div>
						) : null}
					</div>
				</div>

				{showMapModal ? (
					<Dialog open={mapDialogOpen} onOpenChange={setMapDialogOpen}>
						<DialogContent
							className="max-h-[min(90vh,640px)] w-[calc(100%-2rem)] max-w-4xl gap-0 overflow-hidden p-0 sm:max-w-4xl"
							showCloseButton
						>
							<DialogHeader className="border-border/50 space-y-1 border-b px-4 pt-4 pb-3 sm:px-6">
								<DialogTitle className="text-base font-semibold">Map — {name}</DialogTitle>
							</DialogHeader>
							<div className="bg-muted/20 p-2 sm:p-4">
								<div className="aspect-video min-h-[min(50vh,18rem)] w-full overflow-hidden rounded-lg border sm:min-h-80">
									<iframe
										title={`Map for ${name}`}
										src={mapIframeSrc!}
										loading="lazy"
										referrerPolicy="no-referrer-when-downgrade"
										className="h-full min-h-[min(50vh,18rem)] w-full border-0 sm:min-h-80"
									/>
								</div>
								{mapExternal ? (
									<div className="mt-4 flex flex-wrap items-center gap-3">
										<Button
											size="default"
											className="rounded-full"
											nativeButton={false}
											render={
												<a href={mapExternal} target="_blank" rel="noopener noreferrer" />
											}
										>
											<Navigation data-icon="inline-start" />
											See directions
										</Button>
									</div>
								) : null}
							</div>
						</DialogContent>
					</Dialog>
				) : null}
			</div>
		</section>
	)
}
