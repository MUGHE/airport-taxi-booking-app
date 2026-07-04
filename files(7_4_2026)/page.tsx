import { Suspense } from "react"
import { Plane } from "lucide-react"
import { LoginForm } from "@/components/admin/login-form"

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Plane className="size-5" />
          </span>
          <h1 className="mt-3 text-xl font-semibold tracking-tight">Admin sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the admin password to access the operations dashboard.
          </p>
        </div>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
