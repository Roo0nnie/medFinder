"use client"

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@/core/components/ui/dialog"

import { OwnerHelpContent } from "./owner-help-content"

interface OwnerHelpDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function OwnerHelpDialog({ open, onOpenChange }: OwnerHelpDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex max-h-[min(90vh,720px)] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
				<div className="flex min-h-0 flex-1 flex-col">
					<div className="border-border shrink-0 space-y-1 border-b px-4 py-4">
						<DialogTitle className="text-2xl leading-none font-semibold tracking-tight">
							Help
						</DialogTitle>
						<DialogDescription>
							Quick answers, support options, and tips right when you need them.
						</DialogDescription>
					</div>
					<div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
						<OwnerHelpContent />
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}
