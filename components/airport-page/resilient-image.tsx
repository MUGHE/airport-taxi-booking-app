"use client"

import { useEffect, useRef, useState } from "react"

export function ResilientImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
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

  return <img ref={imgRef} className={className} src={src} alt={alt} onError={() => setFailed(true)} />
}
