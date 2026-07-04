"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { loginAdmin } from "@/lib/actions"

export function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    startTransition(async () => {
      const res = await loginAdmin(password)
      if (res.ok) {
        const destination = params.get("from") || "/admin"
        router.push(destination)
        router.refresh()
      } else {
        setError(res.error || "Something went wrong. Please try again.")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          autoFocus
        />
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isPending || !password}>
        {isPending && <Loader2 className="size-4 animate-spin" />}
        Sign in
      </Button>
    </form>
  )
}
