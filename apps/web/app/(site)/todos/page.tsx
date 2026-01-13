export default function TodosPage() {
	return (
		<div className="min-h-screen bg-white font-sans dark:bg-black">
			<div className="mx-auto max-w-4xl px-8 py-16">
				<h1 className="mb-8 text-4xl font-bold tracking-tight text-black dark:text-zinc-50">
					Todos
				</h1>
				<p className="text-lg text-zinc-600 dark:text-zinc-400">
					Todos page - Coming soon. This will integrate with the backend API at{" "}
					<code className="rounded bg-zinc-100 px-2 py-1 text-sm dark:bg-zinc-900">
						/api/v1/examples/todos
					</code>
				</p>
			</div>
		</div>
	)
}
