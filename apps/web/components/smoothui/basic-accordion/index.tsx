"use client"

import { ChevronDown } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { useState, type ReactNode } from "react"

import { cn } from "@/core/lib/utils"

const CHEVRON_ROTATION_DEGREES = 180
const CHEVRON_ANIMATION_DURATION = 0.2

export interface AccordionItem {
	id: string | number
	title: ReactNode
	content: ReactNode
}

export interface BasicAccordionProps {
	items: AccordionItem[]
	allowMultiple?: boolean
	className?: string
	defaultExpandedIds?: Array<string | number>
	contentPaddingClassName?: string
	contentWrapperClassName?: string
	headerButtonClassName?: string
}

export default function BasicAccordion({
	items,
	allowMultiple = false,
	className = "",
	defaultExpandedIds = [],
	contentPaddingClassName = "px-4 py-3",
	contentWrapperClassName,
	headerButtonClassName,
}: BasicAccordionProps) {
	const [expandedItems, setExpandedItems] = useState<Array<string | number>>(defaultExpandedIds)
	const shouldReduceMotion = useReducedMotion()

	const toggleItem = (id: string | number) => {
		if (expandedItems.includes(id)) {
			setExpandedItems(expandedItems.filter(item => item !== id))
		} else if (allowMultiple) {
			setExpandedItems([...expandedItems, id])
		} else {
			setExpandedItems([id])
		}
	}

	return (
		<div
			className={cn(
				"flex w-full flex-col divide-y divide-border overflow-hidden rounded-lg border",
				className
			)}
		>
			{items.map(item => {
				const isExpanded = expandedItems.includes(item.id)

				return (
					<div className="overflow-hidden" key={item.id}>
						<button
							aria-controls={`accordion-content-${item.id}`}
							aria-expanded={isExpanded}
							className={cn(
								"hover:bg-muted/80 focus-visible:ring-primary flex min-h-[44px] w-full items-center justify-between gap-2 bg-transparent px-4 py-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-offset-2",
								headerButtonClassName
							)}
							id={`accordion-header-${item.id}`}
							onClick={() => toggleItem(item.id)}
							type="button"
						>
							<div className="text-foreground min-w-0 font-medium [&_h3]:font-medium">{item.title}</div>
							<motion.div
								animate={{ rotate: isExpanded ? CHEVRON_ROTATION_DEGREES : 0 }}
								className="shrink-0"
								transition={{
									duration: shouldReduceMotion ? 0 : CHEVRON_ANIMATION_DURATION,
								}}
							>
								<ChevronDown className="h-5 w-5" />
							</motion.div>
						</button>

						<AnimatePresence initial={false}>
							{isExpanded && (
								<motion.div
									animate={
										shouldReduceMotion
											? { height: "auto", opacity: 1 }
											: {
													height: "auto",
													opacity: 1,
													transition: {
														height: {
															type: "spring",
															stiffness: 500,
															damping: 40,
															duration: 0.25,
														},
														opacity: { duration: 0.2 },
													},
												}
									}
									aria-labelledby={`accordion-header-${item.id}`}
									className="overflow-hidden"
									exit={
										shouldReduceMotion
											? { height: 0, opacity: 0, transition: { duration: 0 } }
											: {
													height: 0,
													opacity: 0,
													transition: {
														height: { duration: 0.2 },
														opacity: { duration: 0.15 },
													},
												}
									}
									id={`accordion-content-${item.id}`}
									initial={
										shouldReduceMotion
											? { height: "auto", opacity: 1 }
											: { height: 0, opacity: 0 }
									}
									role="region"
								>
									<div
										className={cn(
											"border-border bg-background border-t",
											contentPaddingClassName,
											contentWrapperClassName
										)}
									>
										{item.content}
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				)
			})}
		</div>
	)
}
