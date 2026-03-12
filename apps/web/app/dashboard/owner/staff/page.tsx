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
import { Button } from "@/core/components/ui/button"
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

export default function OwnerStaffPage() {
	const [isCreateOpen, setIsCreateOpen] = useState(false)
	const [isEditOpen, setIsEditOpen] = useState(false)
	const [selectedStaff, setSelectedStaff] = useState<StaffWithOptionalUser | null>(null)
	const [staffToDelete, setStaffToDelete] = useState<StaffWithOptionalUser | null>(null)
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
		setStaffToDelete(staff)
	}

	const handleConfirmDelete = async () => {
		if (!staffToDelete) return
		await deleteStaffMutation.mutateAsync({ id: staffToDelete.id } as any)
		setStaffToDelete(null)
	}

	return (
		<DashboardLayout role="owner">
			<div className="space-y-6">
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-foreground text-3xl font-bold tracking-tight">Staff Management</h1>
						<p className="text-muted-foreground mt-2 text-sm">
							Manage staff connected to your pharmacies. You can add, update, and deactivate staff
							members here.
						</p>
					</div>
					<Button onClick={handleCreateOpen} className="mt-2 sm:mt-0">
						Add staff
					</Button>
				</div>

				<div className="border-border bg-card rounded-xl border p-4 shadow-sm">
					<StaffTable onView={handleView} onEdit={handleEdit} onDelete={handleDelete} />
				</div>

				<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
					<DialogContent>
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
					<DialogContent>
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

				<AlertDialog open={!!staffToDelete} onOpenChange={open => !open && setStaffToDelete(null)}>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Delete staff member</AlertDialogTitle>
							<AlertDialogDescription>
								Are you sure you want to delete this staff profile? This action cannot be undone.
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
