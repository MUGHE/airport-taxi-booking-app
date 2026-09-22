/** Builds a tiny, blurred Cloudinary URL for use as an image placeholder. */
export function cloudinaryBlurUrl(secureUrl: string): string {
  if (!secureUrl.startsWith("https://")) return secureUrl
  const marker = "/upload/"
  const index = secureUrl.indexOf(marker)
  if (index < 0) return secureUrl
  return `${secureUrl.slice(0, index + marker.length)}f_auto,q_20,w_32,h_32,c_fill,e_blur:1000/${secureUrl.slice(index + marker.length)}`
}
