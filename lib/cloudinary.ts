import { createHash } from "node:crypto"

export type CloudinaryConfig = { cloudName: string; apiKey: string; apiSecret: string; uploadFolder: string }

export function getCloudinaryConfig(): CloudinaryConfig | null {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim()
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim()
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim()
  if (!cloudName || !apiKey || !apiSecret) return null
  return { cloudName, apiKey, apiSecret, uploadFolder: process.env.CLOUDINARY_UPLOAD_FOLDER?.trim() || "airport-pages" }
}

export function cloudinaryConfigError(): string {
  return "Image uploads are not configured. Ask the deployment owner to set the Cloudinary cloud name, API key, and server API secret."
}

export async function destroyCloudinaryImage(publicId: string, config: CloudinaryConfig): Promise<{ ok: true } | { ok: false; error: string }> {
  const timestamp = Math.floor(Date.now() / 1000)
  const signature = createCloudinarySignature({ invalidate: "true", public_id: publicId, timestamp }, config.apiSecret)
  const body = new URLSearchParams({ api_key: config.apiKey, invalidate: "true", public_id: publicId, signature, timestamp: String(timestamp) })
  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/image/destroy`, { method: "POST", body })
    const result = await response.json() as { result?: string; error?: { message?: string } }
    if (!response.ok || result.result !== "ok") return { ok: false, error: result.error?.message || "Cloudinary did not delete the image." }
    return { ok: true }
  } catch {
    return { ok: false, error: "Cloudinary could not be reached. The library record was kept." }
  }
}

export function createCloudinarySignature(params: Record<string, string | number>, apiSecret: string): string {
  const serialized = Object.entries(params)
    .filter(([, value]) => value !== "" && value !== undefined && value !== null)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&")
  return createHash("sha1").update(`${serialized}${apiSecret}`).digest("hex")
}

/** Builds the public responsive URL without changing the stored Cloudinary identity. */
export function cloudinaryDeliveryUrl(secureUrl: string, width: number): string {
  if (!secureUrl.startsWith("https://")) return secureUrl
  const marker = "/upload/"
  const index = secureUrl.indexOf(marker)
  if (index < 0) return secureUrl
  return `${secureUrl.slice(0, index + marker.length)}f_auto,q_auto,c_limit,w_${Math.max(320, Math.round(width))}/${secureUrl.slice(index + marker.length)}`
}
