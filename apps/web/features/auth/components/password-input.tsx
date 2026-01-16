"use client"

import * as React from "react"
import { ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Button } from "@/core/components/ui/button"
import { Input, InputWrapper } from "@/core/components/ui/input"
import { cn } from "@/core/lib/utils"

interface PasswordInputProps extends React.ComponentProps<typeof Input> {
	variant?: "sm" | "md" | "lg"
}

export function PasswordInput({ className, variant = "md", ...props }: PasswordInputProps) {
	const [showPassword, setShowPassword] = React.useState(false)

	return (
		<InputWrapper variant={variant} className={cn(className)}>
			<Input {...props} type={showPassword ? "text" : "password"} className="rounded-none" />
			<Button
				type="button"
				variant="ghost"
				size="icon-xs"
				onClick={() => setShowPassword(!showPassword)}
				aria-label={showPassword ? "Hide password" : "Show password"}
				className="-me-1.5 focus-visible:ring-1"
			>
				<HugeiconsIcon icon={showPassword ? ViewOffIcon : ViewIcon} strokeWidth={2} />
			</Button>
		</InputWrapper>
	)
}
