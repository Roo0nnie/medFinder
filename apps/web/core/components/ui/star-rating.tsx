"use client"

import { useState } from "react"
import { Star } from "lucide-react"

import { cn } from "@/core/lib/utils"

interface StarRatingProps {
	rating: number
	onRatingChange?: (rating: number) => void
	maxRating?: number
	className?: string
	disabled?: boolean
}

export function StarRating({
	rating,
	onRatingChange,
	maxRating = 5,
	className,
	disabled = false,
}: StarRatingProps) {
	const [hoverRating, setHoverRating] = useState(0)

	const handleMouseEnter = (index: number) => {
		if (!disabled && onRatingChange) {
			setHoverRating(index)
		}
	}

	const handleMouseLeave = () => {
		if (!disabled && onRatingChange) {
			setHoverRating(0)
		}
	}

	const handleClick = (index: number) => {
		if (!disabled && onRatingChange) {
			onRatingChange(index)
		}
	}

	return (
		<div
			className={cn("flex flex-wrap items-center gap-1", className)}
			onMouseLeave={handleMouseLeave}
		>
			{Array.from({ length: maxRating }).map((_, i) => {
				const starValue = i + 1
				const isActive = starValue <= (hoverRating || rating)
				return (
					<Star
						key={i}
						className={cn(
							"h-5 w-5 transition-all duration-200",
							isActive
								? "fill-yellow-400 text-yellow-400"
								: "fill-transparent text-muted-foreground/30",
							onRatingChange && !disabled
								? "cursor-pointer hover:scale-110 active:scale-95"
								: "",
							disabled && "opacity-50"
						)}
						onMouseEnter={() => handleMouseEnter(starValue)}
						onClick={() => handleClick(starValue)}
					/>
				)
			})}
		</div>
	)
}
