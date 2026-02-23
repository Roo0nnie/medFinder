"use client"

import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/core/components/ui/dialog"

export function LandingRegisterModal({
	open,
	onOpenChange,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
}) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>Registration required</DialogTitle>
				</DialogHeader>
				<p className="text-muted-foreground text-sm">
					To see complete details you need to register.
				</p>
				<DialogFooter showCloseButton={true} />
			</DialogContent>
		</Dialog>
	)
}
