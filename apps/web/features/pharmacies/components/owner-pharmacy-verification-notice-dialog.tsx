"use client"

import { useEffect, useState } from "react"

import { Button } from "@/core/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/core/components/ui/dialog"

import {
	type OwnerVerificationNoticeScope,
	ownerVerificationNoticeStorageKey,
} from "@/features/pharmacies/lib/owner-verification-notice-storage"

type OwnerPharmacyVerificationNoticeDialogProps = {
	pharmacyId: string
	certificateStatus?: string | null
	continueLabel?: string
	dismissalScope?: OwnerVerificationNoticeScope
	persistDismissal?: boolean
}

export function OwnerPharmacyVerificationNoticeDialog({
	pharmacyId,
	certificateStatus,
	continueLabel = "Continue",
	dismissalScope = "dashboard",
	persistDismissal = true,
}: OwnerPharmacyVerificationNoticeDialogProps) {
	const isApproved = certificateStatus === "approved"
	const [open, setOpen] = useState(() => !isApproved && !persistDismissal)

	useEffect(() => {
		if (typeof window === "undefined") return
		if (isApproved) {
			setOpen(false)
			return
		}
		if (persistDismissal) {
			try {
				if (sessionStorage.getItem(ownerVerificationNoticeStorageKey(pharmacyId, dismissalScope))) return
			} catch {
				/* storage unavailable */
			}
		}
		setOpen(true)
	}, [pharmacyId, certificateStatus, isApproved, persistDismissal, dismissalScope])

	const persistDismissed = () => {
		if (isApproved || !persistDismissal) return
		try {
			sessionStorage.setItem(ownerVerificationNoticeStorageKey(pharmacyId, dismissalScope), "1")
		} catch {
			/* ignore */
		}
	}

	const handleOpenChange = (next: boolean) => {
		setOpen(next)
		if (!next) persistDismissed()
	}

	if (isApproved) return null

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-md" showCloseButton>
				<DialogHeader>
					<DialogTitle>Not visible to customers yet</DialogTitle>
					<DialogDescription>
						{certificateStatus === "rejected"
							? "Your business certificate was not approved. Your pharmacy stays hidden from public search and the storefront until verification succeeds. You can still view and edit everything on this page."
							: "Your pharmacy is not shown to customers yet. An administrator must verify your business certificate before it appears in search and on the public site. You can still preview and manage your details below."}
					</DialogDescription>
					<p className="text-foreground text-sm font-medium">
						Certificate status:{" "}
						<span className="uppercase">{certificateStatus ?? "pending"}</span>
					</p>
				</DialogHeader>
				<DialogFooter className="mx-0 mb-0 mt-0 border-0 bg-transparent p-0 pt-2 sm:justify-stretch">
					<Button
						className="h-10 w-full rounded-full px-8 shadow-none sm:w-auto focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0"
						onClick={() => handleOpenChange(false)}
					>
						{continueLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
