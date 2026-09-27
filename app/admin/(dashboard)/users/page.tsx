import type { Metadata } from "next"
import { UsersPanel } from "@/components/admin/users-panel"
import { listAdminUsersAction } from "@/lib/actions"
import { requireAdminSection } from "@/lib/session"

export const metadata: Metadata = { title: "Users" }
export const dynamic = "force-dynamic"

export default async function AdminUsersPage() {
  const currentUser = await requireAdminSection("users", "/admin/users")
  const users = await listAdminUsersAction()

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight">Admin users</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Create staff accounts and choose what each person can access. Deactivated users can&apos;t sign in.
        </p>
      </div>
      <UsersPanel users={users} currentUserId={currentUser.id} />
    </div>
  )
}
