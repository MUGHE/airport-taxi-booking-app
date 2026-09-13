"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import { deleteCloudinaryAssetAction } from "@/lib/actions"
import type { CloudinaryAsset, CloudinaryAssetUsage } from "@/lib/cloudinary-assets"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type Props = { assets: CloudinaryAsset[]; usage: Record<string, CloudinaryAssetUsage> }

export function MediaLibrary({ assets: initialAssets, usage }: Props) {
  const [assets, setAssets] = useState(initialAssets)
  const [message, setMessage] = useState("")
  const [pendingId, setPendingId] = useState<string | null>(null)

  async function remove(asset: CloudinaryAsset) {
    const assetUsage = usage[asset.id]
    if (assetUsage && Object.values(assetUsage).some((ids) => ids.length)) {
      setMessage("This Media Asset is protected because content still uses it.")
      return
    }
    if (!window.confirm(`Permanently delete ${asset.publicId}? This cannot be undone.`)) return
    setPendingId(asset.id)
    setMessage("")
    const result = await deleteCloudinaryAssetAction(asset.id, true)
    setPendingId(null)
    if (!result.ok) { setMessage(result.error); return }
    setAssets((current) => current.filter((item) => item.id !== asset.id))
  }

  return <div className="space-y-4">
    {message && <p role="status" className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">{message}</p>}
    {assets.length === 0 ? <Card><CardContent className="py-10 text-center text-muted-foreground">No uploaded Media Assets yet.</CardContent></Card> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {assets.map((asset) => {
        const assetUsage = usage[asset.id]
        const references = assetUsage ? Object.values(assetUsage).flat().length : 0
        return <Card key={asset.id}>
          <div className="aspect-video bg-muted"><img src={asset.secureUrl} alt={asset.altText} className="size-full object-cover" /></div>
          <CardContent className="space-y-3 pt-4">
            <div className="flex items-start justify-between gap-2"><div><p className="break-all font-medium">{asset.publicId}</p><p className="text-xs text-muted-foreground">{asset.altText}</p></div><Badge variant={references ? "destructive" : "secondary"}>{references ? "Protected" : "Unused"}</Badge></div>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs"><dt className="text-muted-foreground">Dimensions</dt><dd>{asset.width} × {asset.height}</dd><dt className="text-muted-foreground">Format</dt><dd>{asset.format.toUpperCase()}</dd><dt className="text-muted-foreground">Source / owner</dt><dd>{asset.sourceOwner}</dd><dt className="text-muted-foreground">Licence</dt><dd>{asset.licenseNote}</dd><dt className="text-muted-foreground">Uploaded</dt><dd>{new Date(asset.uploadedAt).toLocaleDateString()}</dd><dt className="text-muted-foreground">Usage</dt><dd>{references ? `${references} snapshot reference${references === 1 ? "" : "s"}` : "None"}</dd></dl>
            {references ? <p className="text-xs text-destructive">Protected by current Draft, Published, or recovery content.</p> : <Button variant="destructive" size="sm" disabled={pendingId === asset.id} onClick={() => void remove(asset)}><Trash2 /> Permanently delete</Button>}
          </CardContent>
        </Card>
      })}
    </div>}
  </div>
}
