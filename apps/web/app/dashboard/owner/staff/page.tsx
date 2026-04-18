"use client"

import { useState } from "react"

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/core/components/ui/alert-dialog"
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/core/components/ui/dialog"
import { useDeleteStaffMutation } from "@/features/staff/api/staff.hooks"
import { StaffDetail } from "@/features/staff/components/staff-detail"
import { StaffForm } from "@/features/staff/components/staff-form"
import { StaffTable } from "@/features/staff/components/staff-table"

import { DashboardLayout } from "../../../../features/dashboard/components/DashboardLayout"
import { Card, CardContent } from "@/core/components/ui/card"

type StaffWithOptionalUser = {
	id: string
	userId: string
	department: string
	position: string
	specialization?: string | null
	bio?: string | null
	phone?: string | null
	isActive: boolean
	createdAt: string
	updatedAt: string
	userName?: string | null
	email?: string | null
}

type StaffDeleteState =
	| { kind: "one"; staff: StaffWithOptionalUser }
	| { kind: "many"; staff: StaffWithOptionalUser[] }

export default function OwnerStaffPage() {
	const [isCreateOpen, setIsCreateOpen] = useState(false)
	const [isEditOpen, setIsEditOpen] = useState(false)
	const [selectedStaff, setSelectedStaff] = useState<StaffWithOptionalUser | null>(null)
	const [deleteState, setDeleteState] = useState<StaffDeleteState | null>(null)
	const [selectionClearKey, setSelectionClearKey] = useState(0)
	const [viewStaffId, setViewStaffId] = useState<string | null>(null)
	const [isViewOpen, setIsViewOpen] = useState(false)

	const deleteStaffMutation = useDeleteStaffMutation()

	const handleCreateOpen = () => {
		setSelectedStaff(null)
		setIsCreateOpen(true)
	}

	const handleEdit = (staff: StaffWithOptionalUser) => {
		setSelectedStaff(staff)
		setIsEditOpen(true)
	}

	const handleView = (staff: StaffWithOptionalUser) => {
		setViewStaffId(staff.id)
		setIsViewOpen(true)
	}

	const handleDelete = (staff: StaffWithOptionalUser) => {
		setDeleteState({ kind: "one", staff })
	}

	const handleDeleteMany = (staff: StaffWithOptionalUser[]) => {
		if (staff.length === 0) return
		setDeleteState({ kind: "many", staff })
	}

	const handleConfirmDelete = async () => {
		if (!deleteState) return
		if (deleteState.kind === "one") {
			await deleteStaffMutation.mutateAsync({ id: deleteState.staff.id } as any)
		} else {
			await Promise.all(
				deleteState.staff.map(s => deleteStaffMutation.mutateAsync({ id: s.id } as any))
			)
		}
		setDeleteState(null)
		setSelectionClearKey(k => k + 1)
	}

	return (
		<DashboardLayout role="owner">
			<div className="space-y-6">
				<div>
					<h1 className="text-foreground text-3xl font-bold tracking-tight">Staff Management</h1>
					<p className="text-muted-foreground mt-2 text-sm">
						Manage staff connected to your pharmacies. You can add, update, and deactivate staff
						members here.
					</p>
				</div>

				<Card>
					<CardContent className="space-y-3 p-4 sm:p-6">
						<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<h2 className="text-lg font-semibold">Staff Management</h2>
						</div>

						<StaffTable
						onView={handleView}
						onEdit={handleEdit}
						onDelete={handleDelete}
						onDeleteMany={handleDeleteMany}
						onAddStaff={handleCreateOpen}
						selectionClearKey={selectionClearKey}
					/>
					</CardContent>
				</Card>

				<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
					<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
						<DialogHeader>
							<DialogTitle>Add staff member</DialogTitle>
						</DialogHeader>
						<StaffForm
							onSuccess={() => {
								setIsCreateOpen(false)
							}}
						/>
						<DialogFooter showCloseButton />
					</DialogContent>
				</Dialog>

				<Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
					<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
						<DialogHeader>
							<DialogTitle>Edit staff member</DialogTitle>
						</DialogHeader>
						{selectedStaff && (
							<StaffForm
								staff={selectedStaff}
								onSuccess={() => {
									setIsEditOpen(false)
									setSelectedStaff(null)
								}}
							/>
						)}
						<DialogFooter showCloseButton />
					</DialogContent>
				</Dialog>

				<AlertDialog open={!!deleteState} onOpenChange={open => !open && setDeleteState(null)}>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>
								{deleteState?.kind === "many"
									? `Delete ${deleteState.staff.length} staff members`
									: "Delete staff member"}
							</AlertDialogTitle>
							<AlertDialogDescription>
								{deleteState?.kind === "many" ? (
									<>
										Are you sure you want to delete {deleteState.staff.length} selected staff
										profiles? This action cannot be undone.
									</>
								) : (
									"Are you sure you want to delete this staff profile? This action cannot be undone."
								)}
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction
								onClick={handleConfirmDelete}
								className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							>
								Delete
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>

				<StaffDetail
					staffId={viewStaffId}
					open={isViewOpen}
					onOpenChange={open => {
						setIsViewOpen(open)
						if (!open) {
							setViewStaffId(null)
						}
					}}
				/>
			</div>
		</DashboardLayout>
	)
}
