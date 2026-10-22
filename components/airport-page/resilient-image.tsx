"use client"

import { useEffect, useRef, useState } from "react"
import { cloudinaryDeliveryUrl } from "@/lib/cloudinary-image-url"

// Cloudinary sends a resized WebP/AVIF for each width instead of the full-size upload (often a 2 MB PNG).
const WIDTHS = [480, 800, 1200, 1600, 2000]

/** `fallbackSrc` is shown if `src` fails (for example a CMS image deleted from Cloudinary); without it, a branded placeholder. */
export function ResilientImage({ src: primarySrc, alt, className, sizes = "(min-width: 900px) 50vw, 100vw", priority = false, fallbackSrc }: { src: string; alt: string; className?: string; sizes?: string; priority?: boolean; fallbackSrc?: string }) {
  const [attempt, setAttempt] = useState(0)
  const src = attempt === 1 && fallbackSrc ? fallbackSrc : primarySrc
  const failed = attempt >= (fallbackSrc && fallbackSrc !== primarySrc ? 2 : 1)
  const fail = () => setAttempt((current) => current + 1)
  const imgRef = useRef<HTMLImageElement>(null)

  // An image that fails before hydration never fires the React onError handler, so check on mount too.
  useEffect(() => {
    const img = imgRef.current
    if (img?.complete && img.naturalWidth === 0) fail()
  }, [src])

  if (failed) {
    return <div role="img" aria-label={alt} className={`flex items-center justify-center bg-primary/10 text-center text-sm font-medium text-primary ${className ?? ""}`}><span>ONE Airport Taxi</span></div>
  }

  const isCloudinary = src.includes("res.cloudinary.com") && src.includes("/upload/")
  const srcSet = isCloudinary ? WIDTHS.map((width) => `${cloudinaryDeliveryUrl(src, width)} ${width}w`).join(", ") : undefined
  return (
    <img
      key={src}
      ref={imgRef}
      className={className}
      src={isCloudinary ? cloudinaryDeliveryUrl(src, 1200) : src}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      onError={fail}
    />
  )
}
