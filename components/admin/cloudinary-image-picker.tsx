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

type CropRequest = { file: File; previewUrl: string; width: number; height: number }

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
  const [cropRequest, setCropRequest] = useState<CropRequest>()
  const [cropRatio, setCropRatio] = useState<"4:3" | "16:9">(kind === "hero" ? "16:9" : "4:3")
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    startTransition(async () => {
      const result = await getCloudinaryAssetsAction(kind)
      if (result.ok) setAssets(result.assets)
      else setError(result.error)
    })
  }, [kind])

  useEffect(() => () => { if (cropRequest) URL.revokeObjectURL(cropRequest.previewUrl) }, [cropRequest])

  function needsCrop(width: number, height: number): boolean {
    const ratio = width / height
    if (kind === "hero") return Math.abs(ratio - 16 / 9) > 0.02
    return Math.abs(ratio - 4 / 3) > 0.02 && Math.abs(ratio - 16 / 9) > 0.02
  }

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

  async function prepareFile(file: File) {
    setError("")
    if (file.size > CLOUDINARY_MAX_IMAGE_BYTES) { setError("Images must be 8 MB or smaller."); return }
    if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) { setError("Use a JPG, PNG, WebP, or AVIF image."); return }
    let bitmap: ImageBitmap
    try { bitmap = await createImageBitmap(file) }
    catch { setError("The image dimensions could not be read. Choose a valid image file and try again."); return }
    const { width, height } = bitmap
    bitmap.close()
    if (!needsCrop(width, height)) { await upload(file); return }
    setCropRequest({ file, width, height, previewUrl: URL.createObjectURL(file) })
  }

  async function cropAndUpload() {
    if (!cropRequest) return
    setError("")
    const bitmap = await createImageBitmap(cropRequest.file)
    const [targetWidth, targetHeight] = cropRatio.split(":").map(Number)
    const targetRatio = targetWidth / targetHeight
    const sourceRatio = cropRequest.width / cropRequest.height
    const cropWidth = sourceRatio > targetRatio ? cropRequest.height * targetRatio : cropRequest.width
    const cropHeight = sourceRatio > targetRatio ? cropRequest.height : cropRequest.width / targetRatio
    const outputWidth = kind === "hero" ? Math.min(2400, Math.round(cropWidth)) : Math.min(1600, Math.round(cropWidth))
    const outputHeight = Math.round(outputWidth / targetRatio)
    const canvas = document.createElement("canvas")
    canvas.width = outputWidth
    canvas.height = outputHeight
    const context = canvas.getContext("2d")
    if (!context) { bitmap.close(); setError("The crop tool is not available in this browser."); return }
    context.drawImage(bitmap, (cropRequest.width - cropWidth) / 2, (cropRequest.height - cropHeight) / 2, cropWidth, cropHeight, 0, 0, outputWidth, outputHeight)
    bitmap.close()
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92))
    if (!blob) { setError("The cropped image could not be created. Try another image."); return }
    const croppedFile = new File([blob], `cropped-${cropRequest.file.name.replace(/\.[^.]+$/, "")}.jpg`, { type: "image/jpeg" })
    const previewUrl = cropRequest.previewUrl
    setCropRequest(undefined)
    URL.revokeObjectURL(previewUrl)
    await upload(croppedFile)
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
    {cropRequest && <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-3"><div><p className="font-medium">Crop image before upload</p><p className="text-xs text-muted-foreground">This image does not match the required shape. The crop stays centred and does not stretch the image.</p></div><div className="mx-auto max-w-sm overflow-hidden rounded-md bg-muted" style={{ aspectRatio: cropRatio.replace(":", "/") }}><img src={cropRequest.previewUrl} alt="Preview of image to crop" className="size-full object-cover" /></div><div className="flex flex-wrap items-center gap-2">{kind === "content" && <select aria-label="Crop aspect ratio" className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm" value={cropRatio} onChange={(event) => setCropRatio(event.target.value as "4:3" | "16:9")}><option value="4:3">Crop to 4:3</option><option value="16:9">Crop to 16:9</option></select>}<Button type="button" size="sm" disabled={isPending} onClick={() => void cropAndUpload()}>{isPending ? <Loader2 className="size-4 animate-spin" /> : "Crop & upload"}</Button><Button type="button" variant="ghost" size="sm" onClick={() => { URL.revokeObjectURL(cropRequest.previewUrl); setCropRequest(undefined) }}>Cancel</Button></div></div>}
    <div className="flex flex-wrap gap-2"><select aria-label={`${kind} image library`} className="h-8 min-w-52 rounded-lg border border-input bg-transparent px-2 text-sm" value={value?.assetId ?? ""} onChange={(event) => { const asset = assets.find((item) => item.id === event.target.value); onChange(asset ? toReference(asset) : undefined) }}><option value="">Choose a saved image</option>{assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.publicId} ({asset.width}×{asset.height})</option>)}</select><input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void prepareFile(file); event.currentTarget.value = "" }} /><Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => inputRef.current?.click()}>{isPending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} Upload new image</Button></div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </div>
}
