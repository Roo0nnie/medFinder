import { UserEditClient } from "./user-edit-client"

interface UserEditPageProps {
	params: Promise<{ id: string }>
}

export default async function UserEditPage({ params }: UserEditPageProps) {
	const { id } = await params
	return (
		<div className="flex flex-col gap-6 p-4">
			<h1 className="text-2xl font-bold">Edit user</h1>
			<UserEditClient id={id} />
		</div>
	)
}
