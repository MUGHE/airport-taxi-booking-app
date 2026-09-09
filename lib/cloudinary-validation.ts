export const CLOUDINARY_MAX_IMAGE_BYTES = 8 * 1024 * 1024
export const CLOUDINARY_IMAGE_FORMATS = ["jpg", "jpeg", "png", "webp", "avif"] as const

export type CloudinaryImageKind = "hero" | "content"

export type CloudinaryImageMetadata = {
  kind: CloudinaryImageKind
  format: string
  width: number
  height: number
  bytes: number
  altText: string
  sourceOwner: string
  licenseNote: string
  rightsConfirmed: boolean
}
function formatName(format: string): string {
  return format.trim().toLowerCase().replace(/^image\//, "")
}

export function validateCloudinaryImage(metadata: CloudinaryImageMetadata): string | null {
  const format = formatName(metadata.format)
  if (!(CLOUDINARY_IMAGE_FORMATS as readonly string[]).includes(format)) return "Use a JPG, PNG, WebP, or AVIF image."
  if (!Number.isInteger(metadata.bytes) || metadata.bytes <= 0 || metadata.bytes > CLOUDINARY_MAX_IMAGE_BYTES) return "Images must be 8 MB or smaller."
  if (!Number.isInteger(metadata.width) || !Number.isInteger(metadata.height) || metadata.width <= 0 || metadata.height <= 0) return "The image dimensions could not be verified."
  const ratio = metadata.width / metadata.height
  if (metadata.kind === "hero") {
    if (metadata.width < 1600) return "Hero images must be at least 1600 pixels wide."
    if (Math.abs(ratio - 16 / 9) > 0.02) return "Hero images must use a 16:9 shape."
  } else if (Math.abs(ratio - 4 / 3) > 0.02 && Math.abs(ratio - 16 / 9) > 0.02) {
    return "Content images must use a 4:3 or 16:9 shape."
  }
  if (!metadata.altText.trim()) return "Alt text is required before using an image."
  if (!metadata.sourceOwner.trim()) return "The image source or owner is required."
  if (!metadata.licenseNote.trim()) return "A licence note is required."
  if (!metadata.rightsConfirmed) return "Confirm that you have the right to use this image."
  return null
}
