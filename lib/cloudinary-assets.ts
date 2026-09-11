import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { validateCloudinaryImage, type CloudinaryImageKind, type CloudinaryImageMetadata } from "@/lib/cloudinary-validation"
import { destroyCloudinaryImage, getCloudinaryConfig } from "@/lib/cloudinary"

export type CloudinaryAsset = CloudinaryImageMetadata & {
  id: string
  publicId: string
  secureUrl: string
  resourceType: "image"
  version: number | null
  uploadedAt: string
}
export type MediaSnapshot = {
  pageId: string
  snapshotKind: "draft" | "published" | "recovery"
  content: unknown
}
export type CloudinaryAssetUsage = {
  draftPageIds: string[]
  publishedPageIds: string[]
  recoveryPageIds: string[]
}
type AssetRow = {
  id: string; public_id: string; secure_url: string; resource_type: "image"; version: number | null
  kind: CloudinaryImageKind; format: string; width: number; height: number; bytes: number
  alt_text: string; source_owner: string; license_note: string; rights_confirmed: boolean; uploaded_at: string
}

function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  return url && key ? createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } }) : null
}

function toAsset(row: AssetRow): CloudinaryAsset {
  return { id: row.id, publicId: row.public_id, secureUrl: row.secure_url, resourceType: row.resource_type, version: row.version, kind: row.kind, format: row.format, width: Number(row.width), height: Number(row.height), bytes: Number(row.bytes), altText: row.alt_text, sourceOwner: row.source_owner, licenseNote: row.license_note, rightsConfirmed: row.rights_confirmed, uploadedAt: row.uploaded_at }
}

function contentReferencesAsset(value: unknown, assetId: string): boolean {
  if (!value || typeof value !== "object") return false
  if (Array.isArray(value)) return value.some((item) => contentReferencesAsset(item, assetId))
  const object = value as Record<string, unknown>
  if (object.assetId === assetId) return true
  return Object.values(object).some((item) => contentReferencesAsset(item, assetId))
}

export function findCloudinaryAssetUsage(snapshots: MediaSnapshot[], assetId: string): CloudinaryAssetUsage {
  const usage: CloudinaryAssetUsage = { draftPageIds: [], publishedPageIds: [], recoveryPageIds: [] }
  for (const snapshot of snapshots) {
    if (!contentReferencesAsset(snapshot.content, assetId)) continue
    const key = `${snapshot.snapshotKind}PageIds` as keyof CloudinaryAssetUsage
    const pageIds = usage[key]
    if (!pageIds.includes(snapshot.pageId)) pageIds.push(snapshot.pageId)
  }
  return usage
}

export function isCloudinaryAssetUsed(usage: CloudinaryAssetUsage): boolean {
  return Object.values(usage).some((pageIds) => pageIds.length > 0)
}

export async function listCloudinaryAssets(kind?: CloudinaryImageKind): Promise<CloudinaryAsset[]> {
  const supabase = getSupabase()
  if (!supabase) return []
  let query = supabase.from("cloudinary_media_assets").select("*").order("uploaded_at", { ascending: false })
  if (kind) query = query.eq("kind", kind)
  const { data, error } = await query
  if (error) throw error
  return (data as AssetRow[]).map(toAsset)
}

export async function listCloudinaryAssetUsage(): Promise<Map<string, CloudinaryAssetUsage>> {
  const supabase = getSupabase()
  if (!supabase) return new Map()
  const { data, error } = await supabase.from("destination_page_snapshots").select("page_id, snapshot_kind, content").in("snapshot_kind", ["draft", "published", "recovery"])
  if (error) throw error
  const snapshots = (data ?? []).map((row) => ({ pageId: row.page_id as string, snapshotKind: row.snapshot_kind as MediaSnapshot["snapshotKind"], content: row.content }))
  const assetIds = new Set<string>()
  const collect = (value: unknown) => {
    if (!value || typeof value !== "object") return
    if (Array.isArray(value)) return value.forEach(collect)
    const object = value as Record<string, unknown>
    if (typeof object.assetId === "string") assetIds.add(object.assetId)
    Object.values(object).forEach(collect)
  }
  snapshots.forEach((snapshot) => collect(snapshot.content))
  return new Map([...assetIds].map((assetId) => [assetId, findCloudinaryAssetUsage(snapshots, assetId)]))
}

export async function deleteCloudinaryAsset(assetId: string, confirmed: boolean): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!confirmed) return { ok: false, error: "Confirm permanent deletion to continue." }
  const supabase = getSupabase()
  if (!supabase) return { ok: false, error: "Image storage is not connected to the database." }
  const { data: assetRow, error: assetError } = await supabase.from("cloudinary_media_assets").select("*").eq("id", assetId).maybeSingle()
  if (assetError || !assetRow) return { ok: false, error: "That Media Asset could not be found." }
  const { data: snapshotRows, error: snapshotError } = await supabase.from("destination_page_snapshots").select("page_id, snapshot_kind, content").in("snapshot_kind", ["draft", "published", "recovery"])
  if (snapshotError) return { ok: false, error: "The asset usage could not be checked. Nothing was deleted." }
  const usage = findCloudinaryAssetUsage((snapshotRows ?? []).map((row) => ({ pageId: row.page_id as string, snapshotKind: row.snapshot_kind as MediaSnapshot["snapshotKind"], content: row.content })), assetId)
  if (isCloudinaryAssetUsed(usage)) return { ok: false, error: "This Media Asset is still used by a Draft, Published Snapshot, or recovery snapshot." }
  const config = getCloudinaryConfig()
  if (!config) return { ok: false, error: "Image deletion is not configured on the server. Nothing was deleted." }
  const deleted = await destroyCloudinaryImage(assetRow.public_id as string, config)
  if (!deleted.ok) return { ok: false, error: deleted.error }
  const { error: deleteError } = await supabase.from("cloudinary_media_assets").delete().eq("id", assetId)
  if (deleteError) return { ok: false, error: "Cloudinary deleted the image, but its library record could not be removed. Contact support." }
  return { ok: true }
}

export async function saveCloudinaryAsset(input: Omit<CloudinaryAsset, "id" | "uploadedAt" | "resourceType"> & { resourceType?: "image" }): Promise<{ ok: true; asset: CloudinaryAsset } | { ok: false; error: string }> {
  const validationError = validateCloudinaryImage(input)
  if (validationError) return { ok: false, error: validationError }
  if (!input.publicId.trim() || !input.secureUrl.startsWith("https://")) return { ok: false, error: "Cloudinary returned an invalid image identity." }
  const supabase = getSupabase()
  if (!supabase) return { ok: false, error: "Image storage is not connected to the database." }
  const { data, error } = await supabase.from("cloudinary_media_assets").insert({
    public_id: input.publicId.trim(), secure_url: input.secureUrl, resource_type: "image", version: input.version,
    kind: input.kind, format: input.format.toLowerCase(), width: input.width, height: input.height, bytes: input.bytes,
    alt_text: input.altText.trim(), source_owner: input.sourceOwner.trim(), license_note: input.licenseNote.trim(), rights_confirmed: input.rightsConfirmed,
  }).select("*").single()
  if (error || !data) return { ok: false, error: "The image uploaded but its library record could not be saved." }
  return { ok: true, asset: toAsset(data as AssetRow) }
}
