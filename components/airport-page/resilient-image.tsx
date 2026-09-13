"use client"

import { useState } from "react"

export function ResilientImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return <div role="img" aria-label={alt} className={`flex items-center justify-center bg-primary/10 text-center text-sm font-medium text-primary ${className ?? ""}`}><span>ONE Airport Taxi</span></div>
  }

  return <img className={className} src={src} alt={alt} onError={() => setFailed(true)} />
}

