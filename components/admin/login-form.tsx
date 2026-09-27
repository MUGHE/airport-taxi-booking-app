"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, Lock, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { loginAdmin } from "@/lib/actions"

export function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  const idleLoggedOut = params.get("reason") === "idle"

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    startTransition(async () => {
      const res = await loginAdmin(email, password)
      if (res.ok) {
        // Only follow in-dashboard paths, so a crafted ?from= link can't bounce a fresh sign-in off-site.
        const from = params.get("from")
        const destination = from?.startsWith("/admin") ? from : "/admin"
        router.push(destination)
        router.refresh()
      } else {
        setError(res.error || "Something went wrong. Please try again.")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {idleLoggedOut && (
        <p className="rounded-lg bg-secondary px-3 py-2 text-sm text-muted-foreground">
          You were signed out after a period of inactivity. Please sign in again.
        </p>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="admin-email" className="flex items-center gap-1.5">
          <Mail className="size-4 text-muted-foreground" />
          Email
        </Label>
        <Input
          id="admin-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          autoFocus
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="admin-password" className="flex items-center gap-1.5">
          <Lock className="size-4 text-muted-foreground" />
          Password
        </Label>
        <Input
          id="admin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isPending || !email || !password}>
        {isPending && <Loader2 className="size-4 animate-spin" />}
        Sign in
      </Button>
    </form>
  )
}
