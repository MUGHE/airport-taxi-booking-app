"use client"

import { Check, X } from "lucide-react"
import { PASSWORD_RULES, passwordProblem } from "@/lib/password-policy"
import { cn } from "@/lib/utils"

/** Live view of the password rules; the server re-checks the same rules on submit. */
export function PasswordChecklist({ password, email, id }: { password: string; email?: string; id?: string }) {
  const problem = password ? passwordProblem(password, email) : null
  const extraProblem = problem && PASSWORD_RULES.every((rule) => rule.test(password)) ? problem : null
  return (
    <div id={id} className="space-y-1 text-xs" aria-live="polite">
      <ul className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
        {PASSWORD_RULES.map((rule) => {
          const met = rule.test(password)
          return (
            <li key={rule.label} className={cn("flex items-center gap-1.5", met ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground")}>
              {met ? <Check className="size-3.5 shrink-0" aria-hidden /> : <X className="size-3.5 shrink-0" aria-hidden />}
              <span>{rule.label}<span className="sr-only">{met ? " (done)" : " (missing)"}</span></span>
            </li>
          )
        })}
      </ul>
      {extraProblem && <p className="text-destructive">{extraProblem}</p>}
    </div>
  )
}
