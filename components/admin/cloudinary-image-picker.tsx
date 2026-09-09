"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { Loader2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getCloudinaryAssetsAction, requestCloudinaryUploadSignatureAction, saveCloudinaryAssetAction } from "@/lib/actions"
import type { CloudinaryAsset } from "@/lib/cloudinary-assets"
import { CLOUDINARY_MAX_IMAGE_BYTES, validateCloudinaryImage, type CloudinaryImageKind } from "@/lib/cloudinary-validation"
import type { DestinationImageReference } from "@/lib/destination-content"

function toReference(asset: CloudinaryAsset): DestinationImageReference {
  return { assetId: asset.id, publicId: asset.publicId, secureUrl: asset.secureUrl, width: asset.width, height: asset.height, format: asset.format, altText: asset.altText }
}

export function CloudinaryImagePicker({ kind, value, onChange }: { kind: CloudinaryImageKind; value?: DestinationImageReference; onChange: (value?: DestinationImageReference) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [assets, setAssets] = useState<CloudinaryAsset[]>([])
  const [sourceOwner, setSourceOwner] = useState("")
  const [licenseNote, setLicenseNote] = useState("")
  const [altText, setAltText] = useState(value?.altText ?? "")
  const [rightsConfirmed, setRightsConfirmed] = useState(false)
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    startTransition(async () => {
      const result = await getCloudinaryAssetsAction(kind)
      if (result.ok) setAssets(result.assets)
      else setError(result.error)
    })
  }, [kind])

  async function upload(file: File) {
    setError("")
    if (file.size > CLOUDINARY_MAX_IMAGE_BYTES) { setError("Images must be 8 MB or smaller."); return }
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/avif"]
    if (!allowed.includes(file.type)) { setError("Use a JPG, PNG, WebP, or AVIF image."); return }
    if (!altText.trim() || !sourceOwner.trim() || !licenseNote.trim() || !rightsConfirmed) { setError("Complete alt text, source/owner, licence note, and rights confirmation before uploading."); return }
    let bitmap: ImageBitmap
    try { bitmap = await createImageBitmap(file) }
    catch { setError("The image dimensions could not be read. Choose a valid image file and try again."); return }
    const dimensions = { width: bitmap.width, height: bitmap.height }
    bitmap.close()
    const format = file.type === "image/jpeg" ? "jpg" : file.type.replace("image/", "")
    const validationError = validateCloudinaryImage({ kind, format, width: dimensions.width, height: dimensions.height, bytes: file.size, altText, sourceOwner, licenseNote, rightsConfirmed })
    if (validationError) { setError(validationError); return }
    startTransition(async () => {
      const signature = await requestCloudinaryUploadSignatureAction(kind)
      if (!signature.ok) { setError(signature.error); return }
      const body = new FormData()
      body.append("file", file)
      body.append("api_key", signature.apiKey)
      body.append("timestamp", String(signature.timestamp))
      body.append("folder", signature.folder)
      body.append("signature", signature.signature)
      let response: Response
      try { response = await fetch(`https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`, { method: "POST", body }) }
      catch { setError("The image upload could not reach Cloudinary. Try again."); return }
      if (!response.ok) { setError("Cloudinary rejected the image upload. Check the image and try again."); return }
      const uploaded = await response.json() as { public_id?: string; secure_url?: string; format?: string; width?: number; height?: number; bytes?: number; version?: number }
      if (!uploaded.public_id || !uploaded.secure_url || !uploaded.format || !uploaded.width || !uploaded.height || !uploaded.bytes) { setError("Cloudinary returned incomplete image details."); return }
      const saved = await saveCloudinaryAssetAction({ publicId: uploaded.public_id, secureUrl: uploaded.secure_url, version: uploaded.version ?? null, kind, format: uploaded.format, width: uploaded.width, height: uploaded.height, bytes: uploaded.bytes, altText, sourceOwner, licenseNote, rightsConfirmed })
      if (!saved.ok) { setError(saved.error); return }
      setAssets((current) => [saved.asset, ...current])
      onChange(toReference(saved.asset))
    })
  }

  return <div className="space-y-3 rounded-lg border border-dashed border-border p-4">
    <div><p className="font-medium">{kind === "hero" ? "Hero image" : "Content image"}</p><p className="text-xs text-muted-foreground">{kind === "hero" ? "JPG, PNG, WebP, or AVIF · 16:9 · at least 1600 px wide" : "JPG, PNG, WebP, or AVIF · 4:3 or 16:9"} · up to 8 MB</p></div>
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1"><Label htmlFor={`${kind}-alt`}>Alt text</Label><Input id={`${kind}-alt`} value={altText} onChange={(event) => setAltText(event.target.value)} placeholder="Describe the airport image" /></div>
      <div className="space-y-1"><Label htmlFor={`${kind}-owner`}>Source / owner</Label><Input id={`${kind}-owner`} value={sourceOwner} onChange={(event) => setSourceOwner(event.target.value)} placeholder="ONE Airport Taxi / photographer" /></div>
      <div className="space-y-1 sm:col-span-2"><Label htmlFor={`${kind}-licence`}>Licence note</Label><Input id={`${kind}-licence`} value={licenseNote} onChange={(event) => setLicenseNote(event.target.value)} placeholder="Purchased licence, owned, or permission reference" /></div>
    </div>
    <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={rightsConfirmed} onChange={(event) => setRightsConfirmed(event.target.checked)} /> <span>I confirm that we have the right to use this image.</span></label>
    {value && <div className="flex items-center gap-3 rounded-md bg-secondary/60 p-2 text-sm"><img src={value.secureUrl} alt={value.altText} className="size-14 rounded object-cover" /><span className="min-w-0 flex-1 truncate">{value.publicId}</span><Button type="button" variant="ghost" size="sm" onClick={() => onChange(undefined)}>Remove</Button></div>}
    <div className="flex flex-wrap gap-2"><select aria-label={`${kind} image library`} className="h-8 min-w-52 rounded-lg border border-input bg-transparent px-2 text-sm" value={value?.assetId ?? ""} onChange={(event) => { const asset = assets.find((item) => item.id === event.target.value); onChange(asset ? toReference(asset) : undefined) }}><option value="">Choose a saved image</option>{assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.publicId} ({asset.width}×{asset.height})</option>)}</select><input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); event.currentTarget.value = "" }} /><Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => inputRef.current?.click()}>{isPending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} Upload new image</Button></div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </div>
}
