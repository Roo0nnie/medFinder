"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { PanelLeft, PanelRight } from "lucide-react"

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/core/components/ui/breadcrumb"
import { Button } from "@/core/components/ui/button"
import { Separator } from "@/core/components/ui/separator"
import { ThemeToggle } from "@/core/components/theme-toggle"

export interface DashboardShellHeaderProps {
	rootLabel: string
	rootHref: string
	isSidebarCollapsed: boolean
	onToggleSidebar: () => void
	action?: ReactNode
}

const wordOverrides: Record<string, string> = {
	id: "ID",
	qr: "QR",
}

function formatSegmentLabel(segment: string) {
	const trimmedSegment = decodeURIComponent(segment).trim()

	if (!trimmedSegment) {
		return ""
	}

	if (/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(trimmedSegment)) {
		return "Details"
	}

	return trimmedSegment
		.split(/[-_]/g)
		.map(part => {
			const normalizedPart = part.toLowerCase()
			if (wordOverrides[normalizedPart]) {
				return wordOverrides[normalizedPart]
			}

			return normalizedPart.charAt(0).toUpperCase() + normalizedPart.slice(1)
		})
		.join(" ")
}

export function DashboardShellHeader({
	rootLabel,
	rootHref,
	isSidebarCollapsed,
	onToggleSidebar,
	action,
}: DashboardShellHeaderProps) {
	const pathname = usePathname()
	const segments = pathname.split("/").filter(Boolean)
	const currentSegment = segments[segments.length - 1]
	const currentLabel = currentSegment ? formatSegmentLabel(currentSegment) : rootLabel

	const isAtRoot = pathname === rootHref
	const showRootCrumb = !isAtRoot && (currentLabel !== rootLabel || segments.length > 1)

	return (
		<header className="flex h-16 min-w-0 shrink-0 items-center gap-2 overflow-x-hidden">
			<div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden px-3 sm:px-4 md:px-6">
				<Button
					variant="ghost"
					size="icon"
					className="-ml-1 text-muted-foreground hover:text-foreground"
					onClick={onToggleSidebar}
					aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
				>
					{isSidebarCollapsed ? (
						<PanelRight className="h-5 w-5" />
					) : (
						<PanelLeft className="h-5 w-5" />
					)}
				</Button>
				<Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
				<Breadcrumb className="min-w-0">
					<BreadcrumbList className="min-w-0 flex-nowrap overflow-hidden">
						{showRootCrumb ? (
							<>
								<BreadcrumbItem className="hidden shrink-0 md:block">
									<BreadcrumbLink href={rootHref}>{rootLabel}</BreadcrumbLink>
								</BreadcrumbItem>
								<BreadcrumbSeparator className="hidden md:block" />
							</>
						) : null}
						<BreadcrumbItem className="min-w-0">
							<BreadcrumbPage className="truncate">{currentLabel}</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
			</div>
			<div className="flex shrink-0 items-center gap-2 px-3 sm:px-4 md:px-6">
				<ThemeToggle />
				{action ? <div className="flex shrink-0 items-center">{action}</div> : null}
			</div>
		</header>
	)
}
