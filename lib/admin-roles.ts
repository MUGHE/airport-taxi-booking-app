/**
 * Admin roles and the dashboard sections each one can open. Client-safe (no secrets) —
 * read by server actions for authorization and by the admin nav to hide tabs.
 */

export type AdminSection = "bookings" | "pricing" | "content" | "referrals" | "users"
export type AdminRole = "super_admin" | "admin" | "dispatcher" | "editor"

export const ADMIN_ROLES: Record<AdminRole, { label: string; description: string; sections: AdminSection[] }> = {
  super_admin: { label: "Super admin", description: "Everything, plus managing admin users", sections: ["bookings", "pricing", "content", "referrals", "users"] },
  admin: { label: "Admin", description: "Bookings, pricing, content and referrals", sections: ["bookings", "pricing", "content", "referrals"] },
  dispatcher: { label: "Dispatcher", description: "Bookings only", sections: ["bookings"] },
  editor: { label: "Content editor", description: "Destination pages and media only", sections: ["content"] },
}

export const ADMIN_TABS: { href: string; label: string; section: AdminSection }[] = [
  { href: "/admin", label: "Bookings", section: "bookings" },
  { href: "/admin/pricing", label: "Pricing engine", section: "pricing" },
  { href: "/admin/destination-pages", label: "Destination Pages", section: "content" },
  { href: "/admin/airport-faqs", label: "Airport FAQs", section: "content" },
  { href: "/admin/media-library", label: "Media Library", section: "content" },
  { href: "/admin/referrals", label: "Referrals", section: "referrals" },
  { href: "/admin/users", label: "Users", section: "users" },
]

export function isAdminRole(value: unknown): value is AdminRole {
  return typeof value === "string" && Object.hasOwn(ADMIN_ROLES, value)
}

export function canAccess(role: AdminRole, section: AdminSection): boolean {
  return ADMIN_ROLES[role].sections.includes(section)
}
