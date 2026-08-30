import { cn } from "@/lib/utils"

// A circular loading indicator: a faint full track plus a rotating arc, in the current
// text color (pass a text-* color class via `className`). Used as the page-loading state.
export function ProgressRing({ size = 40, className }: { size?: number; className?: string }) {
  const stroke = Math.max(2.5, size * 0.09)
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn("animate-spin", className)}
      style={{ animationDuration: "0.9s" }}
      role="status"
      aria-label="Loading"
    >
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * 0.72}
      />
    </svg>
  )
}
