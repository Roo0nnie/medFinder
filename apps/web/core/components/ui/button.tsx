"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"

import { cn } from "@/core/lib/utils"
import { buttonVariants, type ButtonVariants } from "@/core/components/ui/button-variants"

type ButtonProps = React.ComponentProps<typeof ButtonPrimitive> & ButtonVariants

function Button({ className, variant = "default", size = "default", ...props }: ButtonProps) {
	return (
		<ButtonPrimitive
			data-slot="button"
			className={cn(buttonVariants({ variant, size }), className)}
			{...props}
		/>
	)
}

export { Button, type ButtonProps }
