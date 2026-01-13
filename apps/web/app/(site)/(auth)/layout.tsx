export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-8 py-16">
			{children}
		</div>
	)
}
