"use client"

import Image, { type ImageProps } from "next/image"
import { useState } from "react"
import { cn } from "@/lib/utils"

type ProgressiveImageProps = Omit<ImageProps, "fill"> & {
  blurDataURL: string
  className?: string
  wrapperClassName?: string
}

export function ProgressiveImage({ blurDataURL, className, wrapperClassName, onLoad, ...props }: ProgressiveImageProps) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className={cn("relative overflow-hidden", wrapperClassName)}>
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 scale-110 bg-cover bg-center blur-xl transition-opacity duration-500",
          loaded ? "opacity-0" : "opacity-100",
        )}
        style={{ backgroundImage: `url(${JSON.stringify(blurDataURL)})` }}
      />
      <Image
        {...props}
        fill
        placeholder="blur"
        blurDataURL={blurDataURL}
        onLoad={(event) => {
          setLoaded(true)
          onLoad?.(event)
        }}
        className={cn("transition-opacity duration-500", loaded ? "opacity-100" : "opacity-0", className)}
      />
    </div>
  )
}
