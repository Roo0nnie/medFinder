export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<div>
			<h1>Default Layout</h1>
			{children}
		</div>
	)
}
