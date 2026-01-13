import Image from "next/image"
import Link from "next/link"

export default function SiteLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen font-sans">
			<nav className="border-border border-b">
				<div className="mx-auto flex max-w-7xl items-center px-8 py-5">
					<Link href="/">
						<Image
							className="dark:invert"
							src="/next.svg"
							alt="Turbo Template logo"
							width={80}
							height={20}
							priority
						/>
					</Link>
				</div>
			</nav>
			<main className="mx-auto flex max-w-7xl flex-col p-8 pb-0">{children}</main>
		</div>
	)
}
