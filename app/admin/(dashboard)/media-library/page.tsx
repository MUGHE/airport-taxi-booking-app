import type { Metadata } from "next"
import { MediaLibrary } from "@/components/admin/media-library"
import { getCloudinaryAssetsAction } from "@/lib/actions"

export const metadata: Metadata = { title: "Media Library" }
export const dynamic = "force-dynamic"

export default async function MediaLibraryPage() {
  const result = await getCloudinaryAssetsAction()
  if (!result.ok) return <p role="alert" className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-950">{result.error}</p>
  return <div><div className="mb-6"><h2 className="text-xl font-semibold tracking-tight">Media Library</h2><p className="mt-1 text-sm text-muted-foreground">Review reusable Cloudinary Media Assets and remove only assets that no content can break.</p></div><MediaLibrary assets={result.assets} usage={result.usage} /></div>
}
