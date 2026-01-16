import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/core/lib/utils"

const inputVariants = cva(
	"dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 disabled:bg-input/50 dark:disabled:bg-input/80 file:text-foreground placeholder:text-muted-foreground w-full min-w-0 border bg-transparent transition-colors outline-none file:inline-flex file:border-0 file:bg-transparent file:font-medium focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-[3px]",
	{
		variants: {
			variant: {
				sm: "h-8 rounded-md px-2.5 py-1 text-xs file:me-2.5 file:h-6 file:pe-2.5 file:text-xs",
				md: "h-8 rounded-lg px-2.5 py-1 text-base file:me-2.5 file:h-6 file:pe-2.5 file:text-sm md:text-sm",
				lg: "h-10 rounded-md px-4 py-1 text-sm file:me-4 file:h-6 file:pe-4 file:text-sm",
			},
		},
		defaultVariants: {
			variant: "md",
		},
	}
)

const inputAddonVariants = cva(
	"bg-muted border-input text-secondary-foreground [&_svg]:text-secondary-foreground/60 flex shrink-0 items-center justify-center border shadow-xs shadow-[rgba(0,0,0,0.05)]",
	{
		variants: {
			variant: {
				sm: "h-8 min-w-7 rounded-md px-2.5 text-xs [&_svg:not([class*=size-])]:size-3.5",
				md: "h-8 min-w-8 rounded-lg px-2.5 text-sm [&_svg:not([class*=size-])]:size-4",
				lg: "h-10 min-w-10 rounded-md px-4 text-sm [&_svg:not([class*=size-])]:size-4.5",
			},
			mode: {
				default: "",
				icon: "justify-center px-0",
			},
		},
		defaultVariants: {
			variant: "md",
			mode: "default",
		},
	}
)

const inputGroupVariants = cva(
	"flex items-stretch [&_[data-slot=button]+[data-slot=input]]:rounded-s-none [&_[data-slot=datefield]]:grow [&_[data-slot=datefield]+[data-slot=input-addon]]:rounded-s-none [&_[data-slot=datefield]+[data-slot=input-addon]]:border-s-0 [&_[data-slot=datefield]~[data-slot=input-addon]]:rounded-s-none [&_[data-slot=input-addon]+[data-slot=input]]:rounded-s-none [&_[data-slot=input-addon]:has(+[data-slot=button])]:rounded-e-none [&_[data-slot=input-addon]:has(+[data-slot=datefield])]:rounded-e-none [&_[data-slot=input-addon]:has(+[data-slot=datefield])]:border-e-0 [&_[data-slot=input-addon]:has(+[data-slot=input])]:rounded-e-none [&_[data-slot=input-addon]:has(+[data-slot=input])]:border-e-0 [&_[data-slot=input]]:grow [&_[data-slot=datefield]:has(~[data-slot=input-addon])]:[&_[data-slot=input]]:rounded-e-none [&_[data-slot=input-addon]+[data-slot=datefield]]:[&_[data-slot=input]]:rounded-s-none [&_[data-slot=input]+[data-slot=button]]:rounded-s-none [&_[data-slot=input]+[data-slot=input-addon]]:rounded-s-none [&_[data-slot=input]+[data-slot=input-addon]]:border-s-0 [&_[data-slot=input]:has(+[data-slot=button])]:rounded-e-none [&_[data-slot=input]:has(+[data-slot=input-addon])]:rounded-e-none",
	{
		variants: {},
		defaultVariants: {},
	}
)

const inputWrapperVariants = cva(
	"has-[:focus-visible]:ring-ring/50 has-[:focus-visible]:border-ring [&_[data-slot=input]]:text-foreground [&_[data-slot=input]]:placeholder:text-muted-foreground [&_svg]:text-muted-foreground has-[[aria-invalid=true]]:border-destructive has-[[aria-invalid=true]]:ring-destructive/20 dark:has-[[aria-invalid=true]]:border-destructive/50 dark:has-[[aria-invalid=true]]:ring-destructive/40 flex items-center gap-1.5 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:outline-none [&_[data-slot=datefield]]:grow [&_[data-slot=input]]:flex [&_[data-slot=input]]:h-auto [&_[data-slot=input]]:w-full [&_[data-slot=input]]:border-0 [&_[data-slot=input]]:bg-transparent [&_[data-slot=input]]:p-0 [&_[data-slot=input]]:shadow-none [&_[data-slot=input]]:transition-colors [&_[data-slot=input]]:outline-none [&_[data-slot=input]]:focus-visible:ring-0 [&_[data-slot=input]]:disabled:cursor-not-allowed [&_[data-slot=input]]:disabled:opacity-50 [&_[data-slot=input]]:data-focus-within:border-0 [&_[data-slot=input]]:data-focus-within:ring-0 [&_[data-slot=input]]:data-focus-within:ring-transparent",
	{
		variants: {
			variant: {
				sm: "gap-1.25 [&_svg:not([class*=size-])]:size-3.5",
				md: "gap-1.5 [&_svg:not([class*=size-])]:size-4",
				lg: "gap-1.5 [&_svg:not([class*=size-])]:size-4",
			},
		},
		defaultVariants: {
			variant: "md",
		},
	}
)

function Input({
	className,
	type,
	variant,
	...props
}: React.ComponentProps<typeof InputPrimitive> & VariantProps<typeof inputVariants>) {
	return (
		<InputPrimitive
			data-slot="input"
			type={type}
			className={cn(inputVariants({ variant }), className)}
			{...props}
		/>
	)
}

function InputAddon({
	className,
	variant,
	mode,
	...props
}: React.ComponentProps<"div"> & VariantProps<typeof inputAddonVariants>) {
	return (
		<div
			data-slot="input-addon"
			className={cn(inputAddonVariants({ variant, mode }), className)}
			{...props}
		/>
	)
}

function InputGroup({
	className,
	...props
}: React.ComponentProps<"div"> & VariantProps<typeof inputGroupVariants>) {
	return <div data-slot="input-group" className={cn(inputGroupVariants(), className)} {...props} />
}

function InputWrapper({
	className,
	variant,
	...props
}: React.ComponentProps<"div"> & VariantProps<typeof inputWrapperVariants>) {
	return (
		<div
			data-slot="input-wrapper"
			className={cn(inputVariants({ variant }), inputWrapperVariants({ variant }), className)}
			{...props}
		/>
	)
}

export { Input, InputAddon, InputGroup, InputWrapper, inputVariants, inputAddonVariants }
