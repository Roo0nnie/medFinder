"use client"

import { useMemo, useState } from "react"

import { Button } from "@/core/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/core/components/ui/dialog"

function normalizeUrl(raw: string) {
	return raw.trim()
}

function getFileKind(url: string): "pdf" | "image" | "unknown" {
	const clean = url.split("?")[0]?.toLowerCase() ?? ""
	if (clean.endsWith(".pdf")) return "pdf"
	if (/\.(png|jpg|jpeg|webp|gif)$/.test(clean)) return "image"
	return "unknown"
}

export function PharmacyPermitClient({
	pharmacyName,
	certificateFileUrl,
}: {
	pharmacyName: string
	certificateFileUrl: string
}) {
	const [open, setOpen] = useState(false)
	const url = useMemo(() => normalizeUrl(certificateFileUrl), [certificateFileUrl])
	const kind = useMemo(() => getFileKind(url), [url])

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger>
				<Button variant="outline" className="rounded-full">
					View Business Permit
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-[min(90vh,820px)] w-[calc(100%-2rem)] max-w-4xl gap-0 overflow-hidden p-0 sm:max-w-4xl">
				<DialogHeader className="border-border/50 space-y-1 border-b px-4 pt-4 pb-3 sm:px-6">
					<DialogTitle className="text-base font-semibold">Business permit — {pharmacyName}</DialogTitle>
					<DialogDescription>
						This document was uploaded by the pharmacy owner.
					</DialogDescription>
				</DialogHeader>

				<div className="bg-muted/20 p-2 sm:p-4">
					<div className="border-border/50 bg-background overflow-hidden rounded-lg border">
						{kind === "pdf" ? (
							<iframe
								title={`Business permit for ${pharmacyName}`}
								src={url}
								className="h-[min(72vh,680px)] w-full border-0"
							/>
						) : kind === "image" ? (
							// eslint-disable-next-line @next/next/no-img-element
							<img
								src={url}
								alt={`Business permit for ${pharmacyName}`}
								className="max-h-[min(72vh,680px)] w-full object-contain"
							/>
						) : (
							<div className="text-muted-foreground flex flex-col items-center justify-center gap-3 p-8 text-center">
								<p className="text-sm">
									Preview isn’t available for this file type.
								</p>
								<Button
									nativeButton={false}
									render={<a href={url} target="_blank" rel="noopener noreferrer" />}
								>
									Open in new tab
								</Button>
							</div>
						)}
					</div>
				</div>

				<DialogFooter showCloseButton className="px-4 sm:px-6">
					<Button nativeButton={false} render={<a href={url} target="_blank" rel="noopener noreferrer" />}>
						Open in new tab
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

