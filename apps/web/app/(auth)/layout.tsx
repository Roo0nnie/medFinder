import { Logo } from "@/core/components/logo"

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<div className="flex min-h-svh flex-col items-center justify-center">
			<div className="flex w-full max-w-3xl flex-col items-center gap-6">
				<Logo className="self-center" />
				{children}
			</div>
		</div>
	)
}
