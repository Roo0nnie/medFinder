"use client"

import { useEffect, useId, useRef, useState } from "react"
import { ImageIcon, Loader2, Upload } from "lucide-react"

import { Button } from "@/core/components/ui/button"
import { Input } from "@/core/components/ui/input"
import { Label } from "@/core/components/ui/label"
import { cn } from "@/core/lib/utils"

import { uploadPharmacyImage } from "../api/pharmacies.hooks"

export type PharmacyImageUploadFieldProps = {
	label: string
	kind: "logo" | "owner"
	value: string
	onUrlChange: (url: string) => void
	pharmacyId?: string | null
	mode: "create" | "edit"
	pendingFile: File | null
	onPendingFileChange: (file: File | null) => void
	disabled?: boolean
}

export function PharmacyImageUploadField({
	label,
	kind,
	value,
	onUrlChange,
	pharmacyId,
	mode,
	pendingFile,
	onPendingFileChange,
	disabled,
}: PharmacyImageUploadFieldProps) {
	const id = useId()
	const fileInputRef = useRef<HTMLInputElement>(null)
	const [busy, setBusy] = useState(false)
	const [blobUrl, setBlobUrl] = useState<string | null>(null)

	useEffect(() => {
		if (!pendingFile) {
			setBlobUrl(null)
			return
		}
		const u = URL.createObjectURL(pendingFile)
		setBlobUrl(u)
		return () => URL.revokeObjectURL(u)
	}, [pendingFile])

	const displaySrc = blobUrl || (value?.trim() ? value.trim() : null)

	const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const f = e.target.files?.[0] ?? null
		e.target.value = ""
		if (!f) return

		const canUploadNow = mode === "edit" && pharmacyId
		if (canUploadNow) {
			setBusy(true)
			try {
				const updated = await uploadPharmacyImage(pharmacyId, kind, f)
				onUrlChange(kind === "logo" ? (updated.logo ?? "") : (updated.ownerImage ?? ""))
				onPendingFileChange(null)
			} finally {
				setBusy(false)
			}
			return
		}

		onPendingFileChange(f)
	}

	const clearAll = () => {
		onPendingFileChange(null)
		onUrlChange("")
		if (fileInputRef.current) fileInputRef.current.value = ""
	}

	return (
		<div className="space-y-2">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<span className="text-sm font-medium leading-none">{label}</span>
				{(displaySrc || pendingFile) && (
					<button
						type="button"
						className="text-muted-foreground hover:text-foreground text-xs font-medium underline-offset-4 hover:underline"
						onClick={clearAll}
						disabled={disabled || busy}
					>
						Remove
					</button>
				)}
			</div>

			<div className="flex flex-col gap-3 sm:flex-row sm:items-start">
				<div
					className={cn(
						"flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-muted/40",
						displaySrc && "border-transparent p-0"
					)}
				>
					{displaySrc ? (
						// eslint-disable-next-line @next/next/no-img-element -- user or blob URL
						<img src={displaySrc} alt="" className="max-h-full max-w-full object-contain" />
					) : (
						<ImageIcon className="text-muted-foreground/50 size-10" aria-hidden />
					)}
				</div>

				<div className="flex min-w-0 flex-1 flex-col gap-2">
					<input
						ref={fileInputRef}
						type="file"
						accept="image/jpeg,image/png,image/webp,image/gif"
						className="sr-only"
						tabIndex={-1}
						aria-hidden
						onChange={e => void handleFile(e)}
						disabled={disabled || busy}
					/>
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="w-full min-h-9 sm:w-auto"
						onClick={() => fileInputRef.current?.click()}
						disabled={disabled || busy}
					>
						{busy ? (
							<Loader2 className="animate-spin" data-icon="inline-start" />
						) : (
							<Upload data-icon="inline-start" />
						)}
						{mode === "create" && !pharmacyId
							? "Choose image"
							: "Upload image"}
					</Button>
					{mode === "create" && !pharmacyId ? (
						<p className="text-muted-foreground text-xs">
							Image uploads after you create the pharmacy. You can also paste a URL below.
						</p>
					) : null}
					<div className="space-y-1">
						<Label htmlFor={`${id}-url`} className="text-muted-foreground text-xs font-normal">
							Or image URL
						</Label>
						<Input
							id={`${id}-url`}
							type="url"
							placeholder="https://…"
							value={value}
							onChange={e => onUrlChange(e.target.value)}
							disabled={disabled || busy}
						/>
					</div>
				</div>
			</div>
		</div>
	)
}
