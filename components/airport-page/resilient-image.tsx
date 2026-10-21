"use client"

import { useEffect, useRef, useState } from "react"
import { cloudinaryDeliveryUrl } from "@/lib/cloudinary-image-url"

// Cloudinary sends a resized WebP/AVIF for each width instead of the full-size upload (often a 2 MB PNG).
const WIDTHS = [480, 800, 1200, 1600, 2000]

export function ResilientImage({ src, alt, className, sizes = "(min-width: 900px) 50vw, 100vw", priority = false }: { src: string; alt: string; className?: string; sizes?: string; priority?: boolean }) {
  const [failed, setFailed] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  // An image that fails before hydration never fires the React onError handler, so check on mount too.
  useEffect(() => {
    const img = imgRef.current
    if (img?.complete && img.naturalWidth === 0) setFailed(true)
  }, [src])

  if (failed) {
    return <div role="img" aria-label={alt} className={`flex items-center justify-center bg-primary/10 text-center text-sm font-medium text-primary ${className ?? ""}`}><span>ONE Airport Taxi</span></div>
  }

  const isCloudinary = src.includes("res.cloudinary.com") && src.includes("/upload/")
  const srcSet = isCloudinary ? WIDTHS.map((width) => `${cloudinaryDeliveryUrl(src, width)} ${width}w`).join(", ") : undefined
  return (
    <img
      ref={imgRef}
      className={className}
      src={isCloudinary ? cloudinaryDeliveryUrl(src, 1200) : src}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      onError={() => setFailed(true)}
    />
  )
}
