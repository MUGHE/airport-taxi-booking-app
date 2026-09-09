import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { validateCloudinaryImage, type CloudinaryImageKind, type CloudinaryImageMetadata } from "@/lib/cloudinary-validation"

export type CloudinaryAsset = CloudinaryImageMetadata & {
  id: string
  publicId: string
  secureUrl: string
  resourceType: "image"
  version: number | null
  uploadedAt: string
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

export async function listCloudinaryAssets(kind?: CloudinaryImageKind): Promise<CloudinaryAsset[]> {
  const supabase = getSupabase()
  if (!supabase) return []
  let query = supabase.from("cloudinary_media_assets").select("*").order("uploaded_at", { ascending: false })
  if (kind) query = query.eq("kind", kind)
  const { data, error } = await query
  if (error) throw error
  return (data as AssetRow[]).map(toAsset)
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
