/**
 * Shared admin session-timeout config.
 *
 * Read by both the edge-safe token logic (`lib/auth.ts`, server/middleware
 * only) and the client-side idle-session UI (`components/admin/idle-session-
 * guard.tsx`) — kept in one place so the two stay in sync. This file must
 * stay free of server secrets/`next/headers` since it's imported client-side.
 */

/** Admin is signed out after this many minutes of no activity. */
export const ADMIN_IDLE_TIMEOUT_MINUTES = 30

/** How long before the idle timeout to warn the admin, with a chance to stay signed in. */
export const ADMIN_IDLE_WARNING_MINUTES = 1
