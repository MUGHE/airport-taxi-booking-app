"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordChecklist } from "@/components/password-checklist"
import { passwordProblem } from "@/lib/password-policy"
import { createAdminUserAction, updateAdminUserAction } from "@/lib/actions"
import { ADMIN_ROLES, type AdminRole } from "@/lib/admin-roles"
import type { AdminUser } from "@/lib/types"

const SELECT_CLASS = "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"

function RoleSelect({ id, value, onChange, disabled }: { id?: string; value: AdminRole; onChange: (role: AdminRole) => void; disabled?: boolean }) {
  return (
    <select id={id} className={SELECT_CLASS} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value as AdminRole)}>
      {Object.entries(ADMIN_ROLES).map(([role, { label, description }]) => <option key={role} value={role}>{label} — {description}</option>)}
    </select>
  )
}

function UserRow({ user, isSelf }: { user: AdminUser; isSelf: boolean }) {
  const router = useRouter()
  const [password, setPassword] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function update(changes: Parameters<typeof updateAdminUserAction>[1], success: string) {
    startTransition(async () => {
      const result = await updateAdminUserAction(user.id, changes)
      if (!result.ok) { toast.error(result.error || "Could not update the user."); return }
      toast.success(success)
      setPassword(null)
      router.refresh()
    })
  }

  return (
    <div className="grid gap-3 rounded-lg border px-3 py-3 text-sm md:grid-cols-[1fr_260px_auto] md:items-center">
      <div className={user.active ? "" : "text-muted-foreground line-through"}>
        <p className="font-medium">{user.name || user.email}{isSelf && <span className="ml-2 text-xs font-normal text-muted-foreground">(you)</span>}</p>
        <p className="text-muted-foreground">{user.email}</p>
      </div>
      {/* Your own role and status are locked so the last super admin can't lock everyone out. */}
      <RoleSelect value={user.role} disabled={isSelf || isPending} onChange={(role) => update({ role }, `${user.email} is now ${ADMIN_ROLES[role].label}.`)} />
      <div className="flex flex-wrap items-center gap-2">
        {password === null ? (
          <Button size="sm" variant="outline" disabled={isPending} onClick={() => setPassword("")}>Reset password</Button>
        ) : (
          <>
            <Input type="password" aria-label={`New password for ${user.email}`} placeholder="New password" className="h-8 w-48" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
            <Button size="sm" disabled={isPending || passwordProblem(password, user.email) !== null} onClick={() => update({ password }, isSelf ? "Password updated." : "Temporary password set. They'll choose a new one at next sign-in.")}>Save</Button>
            <Button size="sm" variant="ghost" disabled={isPending} onClick={() => setPassword(null)}>Cancel</Button>
          </>
        )}
        {!isSelf && (
          <Button size="sm" variant={user.active ? "destructive" : "default"} disabled={isPending} onClick={() => update({ active: !user.active }, `${user.email} ${user.active ? "deactivated" : "reactivated"}.`)}>
            {user.active ? "Deactivate" : "Reactivate"}
          </Button>
        )}
      </div>
      {password !== null && <div className="md:col-span-3"><PasswordChecklist password={password} email={user.email} /></div>}
    </div>
  )
}

export function UsersPanel({ users, currentUserId }: { users: AdminUser[]; currentUserId: string }) {
  const router = useRouter()
  const [form, setForm] = useState({ name: "", email: "", role: "dispatcher" as AdminRole, password: "" })
  const [isPending, startTransition] = useTransition()

  function create(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await createAdminUserAction(form)
      if (!result.ok) { toast.error(result.error || "Could not create the user."); return }
      toast.success(`${form.email} can now sign in.`)
      setForm({ name: "", email: "", role: "dispatcher", password: "" })
      router.refresh()
    })
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-4 text-lg font-semibold">Team</h3>
        <div className="space-y-2">
          {users.map((user) => <UserRow key={user.id} user={user} isSelf={user.id === currentUserId} />)}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Add a user</h3>
          <p className="mt-1 text-sm text-muted-foreground">Share the temporary password with them directly. They must choose their own password the first time they sign in.</p>
        </div>
        <form onSubmit={create} className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="new-user-name">Name</Label><Input id="new-user-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="space-y-1.5"><Label htmlFor="new-user-email">Email</Label><Input id="new-user-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="space-y-1.5"><Label htmlFor="new-user-role">Role</Label><RoleSelect id="new-user-role" value={form.role} onChange={(role) => setForm({ ...form, role })} /></div>
          <div className="space-y-1.5"><Label htmlFor="new-user-password">Temporary password</Label><Input id="new-user-password" type="password" required autoComplete="new-password" aria-describedby="new-user-password-rules" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /><PasswordChecklist id="new-user-password-rules" password={form.password} email={form.email} /></div>
          <div className="sm:col-span-2"><Button type="submit" disabled={isPending || passwordProblem(form.password, form.email) !== null}>Create user</Button></div>
        </form>
      </section>
    </div>
  )
}
