import { endPasswordResetFlow } from "@/lib/session"

/**
 * Called with navigator.sendBeacon from the reset page as it's closed, reloaded or left
 * (a closing page can't wait for a Server Action). Lives under the page's path so the
 * flow's path-scoped, SameSite=Strict cookie is sent — which also means a cross-site POST
 * here carries no cookie and ends nothing.
 */
export async function POST() {
  await endPasswordResetFlow()
  return new Response(null, { status: 204 })
}
